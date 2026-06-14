import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/database';
import { seedDatabase } from '../../src/db/seed';
import {
  createItem,
  getNextRestockDate,
  getRestockDaysRemaining,
  getItemDetail,
  updateItem,
  deleteItem,
  listItems,
  getDisplayLabel,
} from '../../src/services/itemService';
import type { Category, Item } from '../../src/types';

let electronicsCategory: Category;
let applianceCategory: Category;
let baseItem: {
  name: '手机';
  category_id: string;
  quantity: 1;
  status: '在用';
  currency: 'CNY';
  needs_restock: false;
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
    electronicsCategory = (await db.categories.where('template_key').equals('electronics').first())!;
    applianceCategory = (await db.categories.where('template_key').equals('appliance').first())!;
    baseItem = {
      name: '手机',
      category_id: electronicsCategory.id,
      quantity: 1,
      status: '在用',
      currency: 'CNY',
      needs_restock: false,
    };
  });

  it('createItem() creates item with public fields', async () => {
    const item = await createItem({ ...baseItem });
    expect(item.id).toBeDefined();
    expect(item.name).toBe('手机');
    expect(item.category_id).toBe(electronicsCategory.id);
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
    await createItem({ ...baseItem, category_id: electronicsCategory.id });
    await createItem({ ...baseItem, category_id: applianceCategory.id, name: '冰箱' });
    const items = await listItems({ category_id: electronicsCategory.id });
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

  it('listItems() prioritizes items that need regular restocking', async () => {
    await createItem({ ...baseItem, name: '手机' });
    await createItem({
      ...baseItem,
      name: '纸巾',
      needs_restock: true,
      acquired_date: '2026-06-01',
      restock_interval_days: 30,
      restock_threshold: 2,
    });

    const items = await listItems();

    expect(items[0].name).toBe('纸巾');
    expect(items[0].needs_restock).toBe(true);
    expect(items[0].next_restock_date).toBe('2026-07-01');
    expect(items[0].restock_interval_days).toBe(30);
    expect(items[0].restock_threshold).toBe(2);
  });

  it('listItems() sorts restock items by next restock date urgency', async () => {
    await createItem({
      ...baseItem,
      name: '洗衣液',
      needs_restock: true,
      acquired_date: '2026-06-01',
      restock_interval_days: 60,
    });
    await createItem({
      ...baseItem,
      name: '牛奶',
      needs_restock: true,
      acquired_date: '2026-06-01',
      restock_interval_days: 7,
    });

    const items = await listItems();

    expect(items[0].name).toBe('牛奶');
    expect(items[0].next_restock_date).toBe('2026-06-08');
  });
});

describe('itemService — restock schedule', () => {
  it('getNextRestockDate() calculates next restock from acquired date and interval', () => {
    const item = {
      needs_restock: true,
      acquired_date: '2026-06-01',
      restock_interval_days: 14,
    } as Item;

    expect(getNextRestockDate(item)).toBe('2026-06-15');
  });

  it('getRestockDaysRemaining() returns negative days for overdue items', () => {
    const item = {
      needs_restock: true,
      acquired_date: '2026-06-01',
      restock_interval_days: 7,
    } as Item;

    expect(getRestockDaysRemaining(item, new Date('2026-06-10T12:00:00Z'))).toBe(-2);
  });
});

describe('itemService — displayLabel', () => {
  it('getDisplayLabel() returns name + location when location is present', () => {
    const item = { id: '1', name: '充电线' } as Item;
    expect(getDisplayLabel(item, '主卧')).toBe('充电线 · 主卧');
  });

  it('getDisplayLabel() returns name only when neither', () => {
    const item = { id: '1', name: '剪刀' } as Item;
    expect(getDisplayLabel(item)).toBe('剪刀');
  });
});

describe('itemService — EAV custom fields', () => {
  beforeEach(async () => {
    await db.categories.clear();
    await db.channels.clear();
    await db.fields.clear();
    await db.items.clear();
    await db.item_field_values.clear();
    await db.locations.clear();
    await seedDatabase();
    electronicsCategory = (await db.categories.where('template_key').equals('electronics').first())!;
    baseItem = {
      name: '手机',
      category_id: electronicsCategory.id,
      quantity: 1,
      status: '在用',
      currency: 'CNY',
      needs_restock: false,
    };
  });

  it('createItem() saves custom field values', async () => {
    const item = await createItem({
      ...baseItem,
      custom_fields: { serial_number: 'SN-12345', charge_port: 'USB-C' },
    });
    const detail = await getItemDetail(item.id);
    expect(detail?.custom_fields?.serial_number).toBe('SN-12345');
    expect(detail?.custom_fields?.charge_port).toBe('USB-C');
  });

  it('updateItem() modifies custom field values', async () => {
    const item = await createItem({
      ...baseItem,
      custom_fields: { serial_number: 'SN-12345' },
    });
    await updateItem(item.id, {
      custom_fields: { serial_number: 'SN-UPDATED', charge_port: 'Lightning' },
    });
    const detail = await getItemDetail(item.id);
    expect(detail?.custom_fields?.serial_number).toBe('SN-UPDATED');
    expect(detail?.custom_fields?.charge_port).toBe('Lightning');
  });

  it('deleteItem() cascades to delete EAV values', async () => {
    const item = await createItem({
      ...baseItem,
      custom_fields: { serial_number: 'SN-12345' },
    });
    await deleteItem(item.id);
    const eavRows = await db.item_field_values.where('item_id').equals(item.id).toArray();
    expect(eavRows.length).toBe(0);
  });
});
