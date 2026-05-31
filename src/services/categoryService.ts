import { db } from '../db/database';
import type { Category } from '../types';

export async function getAllCategories(): Promise<Category[]> {
  return db.categories.orderBy('sort_order').toArray();
}

export async function getCategoryById(id: string): Promise<Category | null> {
  return (await db.categories.get(id)) ?? null;
}

export async function createCategory(input: Partial<Category>): Promise<Category> {
  const category: Category = {
    id: input.id ?? crypto.randomUUID(),
    name: input.name ?? '',
    parent_id: input.parent_id,
    icon: input.icon,
    sort_order: input.sort_order ?? 99,
  };
  await db.categories.add(category);
  return category;
}

export async function updateCategory(id: string, input: Partial<Category>): Promise<void> {
  await db.categories.update(id, input);
}

export async function deleteCategory(id: string): Promise<void> {
  // Collect all category IDs to delete (target + all descendants)
  const idsToDelete = new Set<string>([id]);
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = await db.categories.where('parent_id').equals(current).toArray();
    for (const child of children) {
      idsToDelete.add(child.id);
      queue.push(child.id);
    }
  }
  const categoryIds = Array.from(idsToDelete);

  // Delete items belonging to these categories
  const items = await db.items.where('category_id').anyOf(categoryIds).toArray();
  for (const item of items) {
    await db.item_field_values.where('item_id').equals(item.id).delete();
    await db.items.delete(item.id);
  }

  // Delete fields belonging to these categories
  for (const cid of categoryIds) {
    const fields = await db.fields.where('category_id').equals(cid).toArray();
    for (const field of fields) {
      await db.item_field_values.where('field_id').equals(field.id).delete();
      await db.fields.delete(field.id);
    }
  }

  // Delete the categories
  for (const cid of categoryIds) {
    await db.categories.delete(cid);
  }
}
