import { db } from './database';
import {
  DEFAULT_CATEGORY_TEMPLATES,
  DEFAULT_CHANNEL_TEMPLATES,
  DEFAULT_FIELD_TEMPLATES,
} from '@metidy/shared';
import type { Category, Channel, Field } from '../types';

export async function seedDatabase(): Promise<void> {
  const catCount = await db.categories.count();
  if (catCount > 0) return;

  const now = new Date().toISOString();
  const categoryIdByTemplate = new Map<string, string>();

  const categories = DEFAULT_CATEGORY_TEMPLATES.map(template => {
    const category: Category = {
      id: crypto.randomUUID(),
      template_key: template.template_key,
      name: template.name,
      icon: template.icon,
      sort_order: template.sort_order,
      created_at: now,
    };
    categoryIdByTemplate.set(template.template_key, category.id);
    return category;
  });

  const channels = DEFAULT_CHANNEL_TEMPLATES.map(template => ({
    id: crypto.randomUUID(),
    template_key: template.template_key,
    name: template.name,
    sort_order: template.sort_order,
    usage_count: template.usage_count,
    created_at: now,
  })) satisfies Channel[];

  const fields = DEFAULT_FIELD_TEMPLATES.map(template => ({
    id: crypto.randomUUID(),
    template_key: template.template_key,
    category_id: categoryIdByTemplate.get(template.category_template_key),
    key: template.key,
    label: template.label,
    data_type: template.data_type,
    options: 'options' in template ? [...template.options] : undefined,
    unit: 'unit' in template ? template.unit : undefined,
    required: template.required,
    sort_order: template.sort_order,
    created_at: now,
  })) satisfies Field[];

  await db.categories.bulkAdd(categories);
  await db.channels.bulkAdd(channels);
  await db.fields.bulkAdd(fields);
}
