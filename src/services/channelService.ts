import { db } from '../db/database';
import type { Channel } from '../types';
import { enqueueSyncChange } from './syncService';

export async function getAllChannels(): Promise<Channel[]> {
  return db.channels.toArray().then(chs =>
    chs.sort((a, b) => b.usage_count - a.usage_count || a.sort_order - b.sort_order)
  );
}

export async function incrementChannelUsage(id: string): Promise<void> {
  const existing = await db.channels.get(id);
  await db.channels.where('id').equals(id).modify(ch => {
    ch.usage_count = (ch.usage_count ?? 0) + 1;
    ch.updated_at = new Date().toISOString();
  });
  const updated = await db.channels.get(id);
  if (updated) await enqueueSyncChange('channel', id, 'update', updated, existing?.version);
}

export async function createChannel(input: Partial<Channel>): Promise<Channel> {
  const channel: Channel = {
    id: input.id ?? crypto.randomUUID(),
    name: input.name ?? '',
    icon: input.icon,
    sort_order: input.sort_order ?? 99,
    usage_count: 0,
    created_at: new Date().toISOString(),
  };
  await db.channels.add(channel);
  await enqueueSyncChange('channel', channel.id, 'create', channel);
  return channel;
}

export async function updateChannel(id: string, input: Partial<Channel>): Promise<void> {
  const existing = await db.channels.get(id);
  await db.channels.update(id, { ...input, updated_at: new Date().toISOString() });
  const updated = await db.channels.get(id);
  if (updated) await enqueueSyncChange('channel', id, 'update', updated, existing?.version);
}

export async function deleteChannel(id: string): Promise<void> {
  const channel = await db.channels.get(id);
  await db.channels.delete(id);
  if (channel) await enqueueSyncChange('channel', id, 'delete', channel, channel.version);
}
