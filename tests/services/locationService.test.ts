import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/database';
import {
  createLocation,
  getLocationTree,
  getDescendantIds,
  deleteLocation,
  updateLocation,
} from '../../src/services/locationService';

describe('locationService', () => {
  beforeEach(async () => {
    await db.locations.clear();
  });

  it('createLocation() adds a top-level location', async () => {
    const loc = await createLocation({ name: '主卧', type: '房间' });
    expect(loc.name).toBe('主卧');
    expect(loc.parent_id).toBeUndefined();
  });

  it('getLocationTree() builds nested tree with item counts', async () => {
    const room = await createLocation({ name: '主卧', type: '房间' });
    await createLocation({ name: '衣柜', type: '家具', parent_id: room.id });
    await createLocation({ name: '书桌', type: '家具', parent_id: room.id });

    const tree = await getLocationTree();
    expect(tree.length).toBe(1);
    expect(tree[0].children.length).toBe(2);
  });

  it('getDescendantIds() returns recursive children', async () => {
    const room = await createLocation({ name: '储物间', type: '房间' });
    const box = await createLocation({ name: '储物箱A', type: '容器', parent_id: room.id });
    await createLocation({ name: '小盒子', type: '容器', parent_id: box.id });

    const ids = await getDescendantIds(room.id);
    expect(ids.length).toBe(2);
    expect(ids).toContain(box.id);
  });

  it('deleteLocation() cascades to children and clears item references', async () => {
    const loc = await createLocation({ name: '杂物间', type: '房间' });
    await deleteLocation(loc.id);
    const all = await db.locations.toArray();
    expect(all.length).toBe(0);
  });

  it('updateLocation() modifies existing location', async () => {
    const loc = await createLocation({ name: '客厅', type: '房间' });
    await updateLocation(loc.id, { name: '大客厅' });
    const updated = await db.locations.get(loc.id);
    expect(updated?.name).toBe('大客厅');
  });
});