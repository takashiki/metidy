import { db } from '../db/database';
import type { Channel } from '../types';

export async function getAllChannels(): Promise<Channel[]> {
  return db.channels.toArray().then(chs =>
    chs.sort((a, b) => b.usage_count - a.usage_count || a.sort_order - b.sort_order)
  );
}

export async function incrementChannelUsage(id: string): Promise<void> {
  const ch = await db.channels.get(id);
  if (ch) {
    await db.channels.update(id, { usage_count: (ch.usage_count ?? 0) + 1 });
  }
}

export async function createChannel(input: Partial<Channel>): Promise<Channel> {
  const channel: Channel = {
    id: crypto.randomUUID(),
    name: input.name ?? '',
    icon: input.icon,
    sort_order: input.sort_order ?? 99,
    usage_count: 0,
    created_at: new Date().toISOString(),
  };
  await db.channels.add(channel);
  return channel;
}

export async function updateChannel(id: string, input: Partial<Channel>): Promise<void> {
  await db.channels.update(id, input);
}

export async function deleteChannel(id: string): Promise<void> {
  await db.channels.delete(id);
}