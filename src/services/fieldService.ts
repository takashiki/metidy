import { db } from '../db/database';
import type { Field, FieldDefinition } from '../types';

export async function getFieldsByCategory(categoryId: string): Promise<FieldDefinition[]> {
  const fields = await db.fields
    .where('category_id')
    .equals(categoryId)
    .sortBy('sort_order');
  return fields;
}

export async function getGlobalFields(): Promise<FieldDefinition[]> {
  const fields = await db.fields
    .filter(f => f.category_id === undefined || f.category_id === null || f.category_id === '')
    .sortBy('sort_order');
  return fields;
}

export async function createField(input: Partial<Field>): Promise<Field> {
  const field: Field = {
    id: input.id ?? crypto.randomUUID(),
    category_id: input.category_id,
    key: input.key ?? '',
    label: input.label ?? '',
    data_type: input.data_type ?? 'text',
    options: input.options,
    unit: input.unit,
    required: input.required ?? false,
    sort_order: input.sort_order ?? 99,
  };
  await db.fields.add(field);
  return field;
}

export async function updateField(id: string, input: Partial<Field>): Promise<void> {
  await db.fields.update(id, input);
}

export async function deleteField(id: string): Promise<void> {
  await db.item_field_values.where('field_id').equals(id).delete();
  await db.fields.delete(id);
}
