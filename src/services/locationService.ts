import { db } from '../db/database';
import type { Location, LocationTreeNode } from '../types';
import { enqueueSyncChange } from './syncService';

export async function createLocation(input: Partial<Location>): Promise<Location> {
  const location: Location = {
    id: input.id ?? crypto.randomUUID(),
    name: input.name ?? '',
    parent_id: input.parent_id,
    type: input.type ?? '房间',
  };
  await db.locations.add(location);
  await enqueueSyncChange('location', location.id, 'create', location);
  return location;
}

export async function updateLocation(id: string, input: Partial<Location>): Promise<void> {
  const existing = await db.locations.get(id);
  await db.locations.update(id, { ...input, updated_at: new Date().toISOString() });
  const updated = await db.locations.get(id);
  if (updated) await enqueueSyncChange('location', id, 'update', updated, existing?.version);
}

export async function deleteLocation(id: string): Promise<void> {
  // Recursively delete children
  const children = await db.locations.where('parent_id').equals(id).toArray();
  for (const child of children) {
    await deleteLocation(child.id);
  }
  // Clear location_id on items at this location
  const items = await db.items.where('location_id').equals(id).toArray();
  for (const item of items) {
    const updated = { ...item, location_id: undefined, updated_at: new Date().toISOString() };
    await db.items.update(item.id, { location_id: undefined, updated_at: updated.updated_at });
    await enqueueSyncChange('item', item.id, 'update', updated, item.version);
  }
  const location = await db.locations.get(id);
  await db.locations.delete(id);
  if (location) await enqueueSyncChange('location', id, 'delete', location, location.version);
}

export async function getDescendantIds(locationId: string): Promise<string[]> {
  const result: string[] = [];
  const children = await db.locations.where('parent_id').equals(locationId).toArray();
  for (const child of children) {
    result.push(child.id);
    const grandChildren = await getDescendantIds(child.id);
    result.push(...grandChildren);
  }
  return result;
}

export async function getLocationTree(): Promise<LocationTreeNode[]> {
  const all = await db.locations.toArray();

  // Count items per location
  const items = await db.items.toArray();
  const itemCounts = new Map<string, number>();
  for (const item of items) {
    if (item.location_id) {
      itemCounts.set(item.location_id, (itemCounts.get(item.location_id) ?? 0) + 1);
    }
  }

  function sumChildCounts(locationId: string): number {
    return all
      .filter(l => l.parent_id === locationId)
      .reduce((sum, child) => sum + (itemCounts.get(child.id) ?? 0) + sumChildCounts(child.id), 0);
  }

  function buildTree(parentId?: string): LocationTreeNode[] {
    return all
      .filter(l => l.parent_id === parentId)
      .map(l => ({
        ...l,
        children: buildTree(l.id),
        item_count: (itemCounts.get(l.id) ?? 0) + sumChildCounts(l.id),
      }));
  }

  return buildTree();
}
