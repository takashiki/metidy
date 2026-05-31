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
    id: crypto.randomUUID(),
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
  await db.categories.delete(id);
}