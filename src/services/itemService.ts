import { db } from '../db/database';
import type { Item, ItemDetail, ItemListItem, ItemFormData, ItemFilter } from '../types';
import { enqueueSyncChange } from './syncService';

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value?: string): Date | null {
  const match = value?.match(DATE_ONLY_PATTERN);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function todayDateOnlyUtc(today = new Date()): Date {
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
}

export function getNextRestockDate(item: Pick<Item, 'needs_restock' | 'acquired_date' | 'restock_interval_days'>): string | undefined {
  if (!item.needs_restock || !item.acquired_date || !item.restock_interval_days) return undefined;
  const lastRestockDate = parseDateOnly(item.acquired_date);
  if (!lastRestockDate) return undefined;

  const nextRestockDate = new Date(lastRestockDate);
  nextRestockDate.setUTCDate(nextRestockDate.getUTCDate() + item.restock_interval_days);
  return formatDateOnly(nextRestockDate);
}

export function getRestockDaysRemaining(
  item: Pick<Item, 'needs_restock' | 'acquired_date' | 'restock_interval_days'>,
  today = new Date()
): number | undefined {
  const nextRestockDate = parseDateOnly(getNextRestockDate(item));
  if (!nextRestockDate) return undefined;
  return Math.round((nextRestockDate.getTime() - todayDateOnlyUtc(today).getTime()) / MS_PER_DAY);
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
    needs_restock: data.needs_restock ?? false,
    restock_interval_days: data.restock_interval_days,
    restock_threshold: data.restock_threshold,
    notes: data.notes,
    created_at: now(),
    updated_at: now(),
  };
  await db.items.add(item);
  await enqueueSyncChange('item', item.id, 'create', item);

  // Write EAV values
  if (data.custom_fields) {
    for (const [key, value] of Object.entries(data.custom_fields)) {
      const field = await db.fields.where({ key, category_id: data.category_id }).first();
      if (field && value !== undefined && value !== '') {
        const fieldValue = {
          id: generateId(),
          item_id: item.id,
          field_id: field.id,
          value,
        };
        await db.item_field_values.add(fieldValue);
        await enqueueSyncChange('item_field_value', fieldValue.id, 'create', fieldValue);
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
  const existing = await db.items.get(id);
  const updateData: Partial<Item> = { ...data, updated_at: now() };
  delete (updateData as any).custom_fields;
  await db.items.update(id, updateData);
  const updated = await db.items.get(id);
  if (updated) {
    await enqueueSyncChange('item', id, 'update', updated, existing?.version);
  }

  // EAV incremental update: delete current, re-insert
  if (data.custom_fields) {
    const item = await db.items.get(id);
    const categoryId = data.category_id ?? item?.category_id;
    const currentValues = await db.item_field_values.where('item_id').equals(id).toArray();
    for (const currentValue of currentValues) {
      await db.item_field_values.delete(currentValue.id);
      await enqueueSyncChange(
        'item_field_value',
        currentValue.id,
        'delete',
        currentValue,
        currentValue.version
      );
    }
    for (const [key, value] of Object.entries(data.custom_fields)) {
      const field = await db.fields.where({ key, category_id: categoryId }).first();
      if (field && value !== undefined && value !== '') {
        const fieldValue = {
          id: generateId(),
          item_id: id,
          field_id: field.id,
          value,
        };
        await db.item_field_values.add(fieldValue);
        await enqueueSyncChange('item_field_value', fieldValue.id, 'create', fieldValue);
      }
    }
  }
}

export async function deleteItem(id: string): Promise<void> {
  const item = await db.items.get(id);
  const fieldValues = await db.item_field_values.where('item_id').equals(id).toArray();
  for (const fieldValue of fieldValues) {
    await db.item_field_values.delete(fieldValue.id);
    await enqueueSyncChange('item_field_value', fieldValue.id, 'delete', fieldValue, fieldValue.version);
  }
  const photos = await db.photos.where('item_id').equals(id).toArray();
  for (const photo of photos) {
    await db.photos.delete(photo.id);
    await enqueueSyncChange('photo', photo.id, 'delete', photo, photo.version);
  }
  await db.items.delete(id);
  if (item) await enqueueSyncChange('item', id, 'delete', item, item.version);
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
    const nextRestockDate = getNextRestockDate(item);
    result.push({
      id: item.id,
      name: item.name,
      category_id: item.category_id,
      category_name: category?.name,
      status: item.status,
      location_name: location?.name,
      rating: item.rating,
      importance: item.importance,
      quantity: item.quantity,
      needs_restock: item.needs_restock ?? false,
      restock_interval_days: item.restock_interval_days,
      restock_threshold: item.restock_threshold,
      next_restock_date: nextRestockDate,
      restock_days_remaining: getRestockDaysRemaining(item),
      created_at: item.created_at,
      display_label: getDisplayLabel(item, location?.name),
    });
  }

  result.sort((a, b) => {
    if (a.needs_restock !== b.needs_restock) return a.needs_restock ? -1 : 1;
    if (a.needs_restock && b.needs_restock) {
      if (a.restock_days_remaining !== undefined && b.restock_days_remaining !== undefined) {
        return a.restock_days_remaining - b.restock_days_remaining;
      }
      if (a.restock_days_remaining !== undefined) return -1;
      if (b.restock_days_remaining !== undefined) return 1;
    }
    return b.created_at.localeCompare(a.created_at);
  });
  return result;
}

export function getDisplayLabel(item: Item, locationName?: string): string {
  if (locationName) return `${item.name} · ${locationName}`;
  return item.name;
}
