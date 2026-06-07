import { db } from './database';
import { DEFAULT_CATEGORIES, DEFAULT_CHANNELS, DEFAULT_DATA_IDS, DEFAULT_FIELDS } from '@metidy/shared';
import type { Category, Channel, Field } from '../types';

const categories = DEFAULT_CATEGORIES.map(category => ({ ...category })) satisfies Category[];
const channels = DEFAULT_CHANNELS.map(channel => ({ ...channel, created_at: '' })) satisfies Channel[];
const fields = DEFAULT_FIELDS.map(field => ({
  ...field,
  options: 'options' in field ? [...field.options] : undefined,
})) satisfies Field[];

export async function seedDatabase(): Promise<void> {
  const catCount = await db.categories.count();
  if (catCount > 0) return;

  const now = new Date().toISOString();
  const channelsWithTime = channels.map(c => ({ ...c, created_at: now }));

  await db.categories.bulkAdd(categories);
  await db.channels.bulkAdd(channelsWithTime);
  await db.fields.bulkAdd(fields);
}

export { DEFAULT_DATA_IDS as SEED_IDS };
