import { db } from '../db/database';
import type { Item, ItemDetail, ItemListItem, ItemFormData, ItemFilter } from '../types';

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

export async function createItem(data: ItemFormData): Promise<Item> {
  const item: Item = {
    id: generateId(),
    name: data.name,
    category_id: data.category_id,
    quantity: data.quantity ?? 1,
    status: data.status ?? '在用',
    location_id: data.location_id,
    channel_id: data.channel_id,
    acquired_date: data.acquired_date,
    price: data.price,
    currency: data.currency ?? 'CNY',
    rating: data.rating,
    importance: data.importance,
    warranty_until: data.warranty_until,
    notes: data.notes,
    created_at: now(),
    updated_at: now(),
  };
  await db.items.add(item);

  // Write EAV values
  if (data.custom_fields) {
    for (const [key, value] of Object.entries(data.custom_fields)) {
      const field = await db.fields.where({ key, category_id: data.category_id }).first();
      if (field && value !== undefined && value !== '') {
        await db.item_field_values.add({
          item_id: item.id,
          field_id: field.id,
          value,
        });
      }
    }
  }

  return item;
}

export async function getItemDetail(id: string): Promise<ItemDetail | null> {
  const item = await db.items.get(id);
  if (!item) return null;

  const category = item.category_id ? await db.categories.get(item.category_id) : undefined;
  const location = item.location_id ? await db.locations.get(item.location_id) : undefined;
  const channel = item.channel_id ? await db.channels.get(item.channel_id) : undefined;

  const eavRows = await db.item_field_values.where('item_id').equals(id).toArray();
  const custom_fields: Record<string, any> = {};
  for (const row of eavRows) {
    const field = await db.fields.get(row.field_id);
    if (field) {
      custom_fields[field.key] = row.value;
    }
  }

  return {
    ...item,
    category_name: category?.name,
    location_name: location?.name,
    channel_name: channel?.name,
    custom_fields,
  };
}

export async function updateItem(id: string, data: Partial<ItemFormData>): Promise<void> {
  const updateData: Partial<Item> = { ...data, updated_at: now() };
  delete (updateData as any).custom_fields;
  await db.items.update(id, updateData);

  // EAV incremental update: delete current, re-insert
  if (data.custom_fields) {
    const item = await db.items.get(id);
    const categoryId = data.category_id ?? item?.category_id;
    await db.item_field_values.where('item_id').equals(id).delete();
    for (const [key, value] of Object.entries(data.custom_fields)) {
      const field = await db.fields.where({ key, category_id: categoryId }).first();
      if (field && value !== undefined && value !== '') {
        await db.item_field_values.add({
          item_id: id,
          field_id: field.id,
          value,
        });
      }
    }
  }
}

export async function deleteItem(id: string): Promise<void> {
  await db.item_field_values.where('item_id').equals(id).delete();
  await db.photos.where('item_id').equals(id).delete();
  await db.items.delete(id);
}

export async function listItems(filter?: ItemFilter): Promise<ItemListItem[]> {
  let collection = db.items.toCollection();

  if (filter?.category_id) {
    collection = collection.filter(i => i.category_id === filter.category_id);
  }
  if (filter?.status) {
    collection = collection.filter(i => i.status === filter.status);
  }
  if (filter?.location_id) {
    collection = collection.filter(i => i.location_id === filter.location_id);
  }
  if (filter?.channel_id) {
    collection = collection.filter(i => i.channel_id === filter.channel_id);
  }

  let items = await collection.toArray();

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.notes && i.notes.toLowerCase().includes(q))
    );
  }

  const result: ItemListItem[] = [];
  for (const item of items) {
    const location = item.location_id ? await db.locations.get(item.location_id) : undefined;
    const category = await db.categories.get(item.category_id);
    result.push({
      id: item.id,
      name: item.name,
      category_id: item.category_id,
      category_name: category?.name,
      status: item.status,
      location_name: location?.name,
      rating: item.rating,
      importance: item.importance,
      created_at: item.created_at,
      display_label: getDisplayLabel(item, location?.name),
    });
  }

  result.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return result;
}

export function getDisplayLabel(item: Item, locationName?: string): string {
  if (locationName) return `${item.name} · ${locationName}`;
  return item.name;
}
