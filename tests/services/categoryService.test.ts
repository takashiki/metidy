import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/database';
import { seedDatabase } from '../../src/db/seed';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../src/services/categoryService';

describe('categoryService', () => {
  beforeEach(async () => {
    await db.categories.clear();
    await db.channels.clear();
    await db.fields.clear();
    await db.items.clear();
    await db.item_field_values.clear();
    await seedDatabase();
  });

  it('getAllCategories() returns all categories ordered by sort_order', async () => {
    const cats = await getAllCategories();
    expect(cats.length).toBe(6);
    expect(cats[0].name).toBe('家用电器');
    expect(cats[0].sort_order).toBe(1);
  });

  it('getCategoryById() returns correct category', async () => {
    const cat = await getCategoryById('cat-001');
    expect(cat?.name).toBe('家用电器');
  });

  it('getCategoryById() returns null for unknown id', async () => {
    const cat = await getCategoryById('nonexistent');
    expect(cat).toBeNull();
  });

  it('createCategory() inserts and returns new category', async () => {
    const created = await createCategory({ name: '运动器材', sort_order: 7 });
    expect(created.id).toBeDefined();
    expect(created.name).toBe('运动器材');
    const all = await getAllCategories();
    expect(all.length).toBe(7);
  });

  it('updateCategory() modifies existing category', async () => {
    await updateCategory('cat-001', { name: '家电' });
    const cat = await getCategoryById('cat-001');
    expect(cat?.name).toBe('家电');
  });

  it('deleteCategory() removes category', async () => {
    await deleteCategory('cat-006');
    const all = await getAllCategories();
    expect(all.length).toBe(5);
  });

  it('deleteCategory() cascades to fields of the deleted category', async () => {
    // cat-001 (家用电器) has 5 fields seeded
    const fieldsBefore = await db.fields.where('category_id').equals('cat-001').count();
    expect(fieldsBefore).toBe(5);

    await deleteCategory('cat-001');

    const fieldsAfter = await db.fields.where('category_id').equals('cat-001').count();
    expect(fieldsAfter).toBe(0);
    const cat = await getCategoryById('cat-001');
    expect(cat).toBeNull();
  });

  it('deleteCategory() cascades to child categories', async () => {
    // Create a parent-child hierarchy
    await createCategory({ id: 'parent-cat', name: 'Parent', sort_order: 10 });
    await createCategory({ id: 'child-cat', name: 'Child', parent_id: 'parent-cat', sort_order: 11 });
    // Add a field to the child category
    await db.fields.add({
      id: 'child-fld', category_id: 'child-cat', key: 'test_key', label: 'Test',
      data_type: 'text', required: false, sort_order: 1,
    });

    await deleteCategory('parent-cat');

    expect(await getCategoryById('parent-cat')).toBeNull();
    expect(await getCategoryById('child-cat')).toBeNull();
    expect(await db.fields.get('child-fld')).toBeUndefined();
  });
});
