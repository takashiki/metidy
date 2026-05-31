import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/database';
import { seedDatabase } from '../../src/db/seed';
import {
  getAllChannels,
  incrementChannelUsage,
  createChannel,
} from '../../src/services/channelService';

describe('channelService', () => {
  beforeEach(async () => {
    await db.categories.clear();
    await db.channels.clear();
    await db.fields.clear();
    await seedDatabase();
  });

  it('getAllChannels() returns channels ordered by usage_count DESC', async () => {
    const chs = await getAllChannels();
    expect(chs.length).toBe(5);
    expect(chs[0].name).toBeDefined();
  });

  it('incrementChannelUsage() increases usage_count', async () => {
    await incrementChannelUsage('ch-001');
    const ch = await db.channels.get('ch-001');
    expect(ch?.usage_count).toBe(1);

    const sorted = await getAllChannels();
    expect(sorted[0].id).toBe('ch-001');
  });

  it('createChannel() inserts with default usage_count=0', async () => {
    const created = await createChannel({ name: 'Costco' });
    expect(created.usage_count).toBe(0);
    expect(created.name).toBe('Costco');
  });
});