import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/database';
import { seedDatabase } from '../../src/db/seed';
import {
  createItem,
  getItemDetail,
  updateItem,
  deleteItem,
  listItems,
  getDisplayLabel,
} from '../../src/services/itemService';
import type { Item } from '../../src/types';

const baseItem = {
  name: '手机',
  category_id: 'cat-003',
  quantity: 1,
  status: '在用' as const,
  currency: 'CNY',
};

describe('itemService — basic CRUD', () => {
  beforeEach(async () => {
    await db.categories.clear();
    await db.channels.clear();
    await db.fields.clear();
    await db.items.clear();
    await db.item_field_values.clear();
    await db.locations.clear();
    await seedDatabase();
  });

  it('createItem() creates item with public fields', async () => {
    const item = await createItem({ ...baseItem, brand_model: 'iPhone 15 Pro' });
    expect(item.id).toBeDefined();
    expect(item.name).toBe('手机');
    expect(item.brand_model).toBe('iPhone 15 Pro');
  });

  it('getItemDetail() returns item with category name', async () => {
    const item = await createItem({ ...baseItem });
    const detail = await getItemDetail(item.id);
    expect(detail?.category_name).toBe('电子设备');
  });

  it('updateItem() modifies public fields', async () => {
    const item = await createItem({ ...baseItem });
    await updateItem(item.id, { name: '备用手机', rating: 4 });
    const updated = await db.items.get(item.id);
    expect(updated?.name).toBe('备用手机');
    expect(updated?.rating).toBe(4);
  });

  it('deleteItem() removes item and cascades EAV values', async () => {
    const item = await createItem({ ...baseItem });
    await deleteItem(item.id);
    const found = await db.items.get(item.id);
    expect(found).toBeUndefined();
  });

  it('listItems() filters by category', async () => {
    await createItem({ ...baseItem, category_id: 'cat-003' });
    await createItem({ ...baseItem, category_id: 'cat-001', name: '冰箱' });
    const items = await listItems({ category_id: 'cat-003' });
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('手机');
  });

  it('listItems() filters by status', async () => {
    await createItem({ ...baseItem, status: '在用' });
    await createItem({ ...baseItem, status: '闲置', name: '平板' });
    const items = await listItems({ status: '闲置' });
    expect(items.length).toBe(1);
  });

  it('listItems() search by name', async () => {
    await createItem({ ...baseItem, name: '手机' });
    await createItem({ ...baseItem, name: '充电器' });
    const items = await listItems({ search: '手机' });
    expect(items.length).toBe(1);
  });
});

describe('itemService — displayLabel', () => {
  it('getDisplayLabel() returns brand_model when present', () => {
    const item = { id: '1', name: '手机', brand_model: 'iPhone 15 Pro' } as Item;
    expect(getDisplayLabel(item)).toBe('iPhone 15 Pro');
  });

  it('getDisplayLabel() returns name + location when no brand_model', () => {
    const item = { id: '1', name: '充电线' } as Item;
    expect(getDisplayLabel(item, '主卧')).toBe('充电线 · 主卧');
  });

  it('getDisplayLabel() returns name only when neither', () => {
    const item = { id: '1', name: '剪刀' } as Item;
    expect(getDisplayLabel(item)).toBe('剪刀');
  });
});