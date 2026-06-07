import type {
  AuthTokenResponse,
  SyncChange,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
} from '@metidy/shared';
import { db } from '../db/database';
import type { SyncEntityType, SyncOperation, SyncOutboxEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const ACCESS_TOKEN_KEY = 'metidy.access_token';
const REFRESH_TOKEN_KEY = 'metidy.refresh_token';
const DEVICE_ID_KEY = 'metidy.device_id';
const USER_ID_KEY = 'metidy.user_id';
const LEGACY_SYNC_CURSOR_KEY = 'sync.cursor';
const BACKGROUND_SYNC_INTERVAL_MS = 30_000;

const ENTITY_APPLY_ORDER: Record<SyncEntityType, number> = {
  category: 10,
  location: 20,
  channel: 30,
  field: 40,
  item: 50,
  item_field_value: 60,
  photo: 70,
};

let applyingRemoteChange = false;
let backgroundSyncTimer: number | undefined;
let syncInProgress = false;

function now(): string {
  return new Date().toISOString();
}

function compactPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null)
  );
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...init.headers,
    },
  });

  if (response.status !== 401 || path === '/auth/refresh') return response;

  const refreshed = await refreshAuthToken();
  if (!refreshed) return response;

  return fetch(`${API_BASE_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...init.headers,
    },
  });
}

function storeAuth(response: AuthTokenResponse): AuthTokenResponse {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
  localStorage.setItem(DEVICE_ID_KEY, response.device_id);
  localStorage.setItem(USER_ID_KEY, response.user.id);
  return response;
}

export function isSyncConfigured(): boolean {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY) && localStorage.getItem(DEVICE_ID_KEY));
}

async function ensureSyncIdentity(): Promise<boolean> {
  if (!isSyncConfigured()) return false;
  if (localStorage.getItem(USER_ID_KEY)) return true;
  return refreshAuthToken();
}

function syncCursorKey(): string {
  const userId = localStorage.getItem(USER_ID_KEY);
  return userId ? `sync.cursor.${userId}` : LEGACY_SYNC_CURSOR_KEY;
}

export async function registerForSync(input: {
  email: string;
  password: string;
  name?: string;
  device_name?: string;
}): Promise<AuthTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`Register failed: ${response.status}`);
  return storeAuth((await response.json()) as AuthTokenResponse);
}

export async function loginForSync(input: {
  email: string;
  password: string;
  device_name?: string;
}): Promise<AuthTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`Login failed: ${response.status}`);
  return storeAuth((await response.json()) as AuthTokenResponse);
}

export async function refreshAuthToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) return false;
  storeAuth((await response.json()) as AuthTokenResponse);
  return true;
}

export function clearSyncAuth(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(DEVICE_ID_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export async function enqueueSyncChange(
  entityType: SyncEntityType,
  entityId: string,
  operation: SyncOperation,
  payload: object,
  baseVersion?: number
): Promise<void> {
  if (applyingRemoteChange) return;

  const timestamp = now();
  const entry: SyncOutboxEntry = {
    entity_type: entityType,
    entity_id: entityId,
    operation,
    base_version: baseVersion,
    payload: compactPayload(payload as Record<string, unknown>),
    status: 'pending',
    attempts: 0,
    created_at: timestamp,
    updated_at: timestamp,
  };
  await db.sync_outbox.add(entry);
}

export async function withRemoteSyncSuppressed<T>(callback: () => Promise<T>): Promise<T> {
  applyingRemoteChange = true;
  try {
    return await callback();
  } finally {
    applyingRemoteChange = false;
  }
}

function outboxToChange(entry: SyncOutboxEntry): SyncChange {
  return {
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    operation: entry.operation,
    base_version: entry.base_version,
    changed_at: entry.updated_at,
    payload: entry.payload,
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function sortOutboxForPush(entries: SyncOutboxEntry[]): SyncOutboxEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const orderDiff =
        ENTITY_APPLY_ORDER[left.entry.entity_type] - ENTITY_APPLY_ORDER[right.entry.entity_type];
      return orderDiff === 0 ? left.index - right.index : orderDiff;
    })
    .map(({ entry }) => entry);
}

async function hasQueuedChange(entityType: SyncEntityType, entityId: string): Promise<boolean> {
  const count = await db.sync_outbox
    .where('entity_type')
    .equals(entityType)
    .and(entry => entry.entity_id === entityId)
    .count();
  return count > 0;
}

async function enqueueBackfillChange(
  entityType: SyncEntityType,
  row: { id: string; version?: number },
  includeVersioned: boolean
): Promise<void> {
  if (
    (!includeVersioned && row.version !== undefined) ||
    !isUuid(row.id) ||
    await hasQueuedChange(entityType, row.id)
  ) {
    return;
  }
  await enqueueSyncChange(entityType, row.id, 'create', row);
}

async function backfillUnsyncedLocalChanges(): Promise<number> {
  const cursor = (await db.sync_meta.get(syncCursorKey()))?.value ?? '0';
  const includeVersioned = cursor === '0';
  let added = 0;
  for (const row of await db.categories.toArray()) {
    const before = await hasQueuedChange('category', row.id);
    await enqueueBackfillChange('category', row, includeVersioned);
    if (!before && (includeVersioned || row.version === undefined) && isUuid(row.id)) added += 1;
  }
  for (const row of await db.locations.toArray()) {
    const before = await hasQueuedChange('location', row.id);
    await enqueueBackfillChange('location', row, includeVersioned);
    if (!before && (includeVersioned || row.version === undefined) && isUuid(row.id)) added += 1;
  }
  for (const row of await db.channels.toArray()) {
    const before = await hasQueuedChange('channel', row.id);
    await enqueueBackfillChange('channel', row, includeVersioned);
    if (!before && (includeVersioned || row.version === undefined) && isUuid(row.id)) added += 1;
  }
  for (const row of await db.fields.toArray()) {
    const before = await hasQueuedChange('field', row.id);
    await enqueueBackfillChange('field', row, includeVersioned);
    if (!before && (includeVersioned || row.version === undefined) && isUuid(row.id)) added += 1;
  }
  for (const row of await db.items.toArray()) {
    const before = await hasQueuedChange('item', row.id);
    await enqueueBackfillChange('item', row, includeVersioned);
    if (!before && (includeVersioned || row.version === undefined) && isUuid(row.id)) added += 1;
  }
  for (const row of await db.item_field_values.toArray()) {
    const before = await hasQueuedChange('item_field_value', row.id);
    await enqueueBackfillChange('item_field_value', row, includeVersioned);
    if (!before && (includeVersioned || row.version === undefined) && isUuid(row.id)) added += 1;
  }
  for (const row of await db.photos.toArray()) {
    const before = await hasQueuedChange('photo', row.id);
    await enqueueBackfillChange('photo', row, includeVersioned);
    if (!before && (includeVersioned || row.version === undefined) && isUuid(row.id)) added += 1;
  }
  return added;
}

async function applyAcceptedVersions(accepted: SyncPushResponse['accepted']): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.categories,
      db.locations,
      db.channels,
      db.fields,
      db.items,
      db.item_field_values,
      db.photos,
    ],
    async () => {
      for (const item of accepted) {
        switch (item.entity_type) {
          case 'category':
            await db.categories.update(item.entity_id, { version: item.version });
            break;
          case 'location':
            await db.locations.update(item.entity_id, { version: item.version });
            break;
          case 'channel':
            await db.channels.update(item.entity_id, { version: item.version });
            break;
          case 'field':
            await db.fields.update(item.entity_id, { version: item.version });
            break;
          case 'item':
            await db.items.update(item.entity_id, { version: item.version });
            break;
          case 'item_field_value':
            await db.item_field_values.update(item.entity_id, { version: item.version });
            break;
          case 'photo':
            await db.photos.update(item.entity_id, { version: item.version });
            break;
        }
      }
    }
  );
}

async function markOutboxFailed(entries: SyncOutboxEntry[], error: string): Promise<void> {
  const timestamp = now();
  await db.transaction('rw', db.sync_outbox, async () => {
    for (const entry of entries) {
      if (entry.id === undefined) continue;
      await db.sync_outbox.update(entry.id, {
        status: 'failed',
        attempts: entry.attempts + 1,
        last_error: error,
        updated_at: timestamp,
      });
    }
  });
}

async function applyRemoteChange(change: SyncChange): Promise<void> {
  await withRemoteSyncSuppressed(async () => {
    if (change.operation === 'delete') {
      switch (change.entity_type) {
        case 'item':
          await db.items.delete(change.entity_id);
          return;
        case 'category':
          await db.categories.delete(change.entity_id);
          return;
        case 'location':
          await db.locations.delete(change.entity_id);
          return;
        case 'channel':
          await db.channels.delete(change.entity_id);
          return;
        case 'field':
          await db.fields.delete(change.entity_id);
          return;
        case 'item_field_value':
          await db.item_field_values.delete(change.entity_id);
          return;
        case 'photo':
          await db.photos.delete(change.entity_id);
          return;
      }
    }

    const payload = { ...change.payload, id: change.entity_id, version: change.version };
    switch (change.entity_type) {
      case 'item':
        await db.items.put(payload as any);
        return;
      case 'category':
        await db.categories.put(payload as any);
        return;
      case 'location':
        await db.locations.put(payload as any);
        return;
      case 'channel':
        await db.channels.put(payload as any);
        return;
      case 'field':
        await db.fields.put(payload as any);
        return;
      case 'item_field_value':
        await db.item_field_values.put(payload as any);
        return;
      case 'photo':
        await db.photos.put(payload as any);
        return;
    }
  });
}

export async function pushLocalChanges(): Promise<(SyncPushResponse & {
  backfilled: number;
  queued: number;
}) | null> {
  const deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId || !localStorage.getItem(ACCESS_TOKEN_KEY)) return null;

  const backfilled = await backfillUnsyncedLocalChanges();

  const entries = await db.sync_outbox
    .where('status')
    .anyOf('pending', 'failed', 'syncing')
    .limit(500)
    .toArray();
  if (entries.length === 0) return { accepted: [], conflicts: [], backfilled, queued: 0 };

  const timestamp = now();
  await db.transaction('rw', db.sync_outbox, async () => {
    for (const entry of entries) {
      if (entry.id !== undefined) {
        await db.sync_outbox.update(entry.id, { status: 'syncing', updated_at: timestamp });
      }
    }
  });

  const changes = sortOutboxForPush(entries).map(outboxToChange);
  const request: SyncPushRequest = {
    device_id: deviceId,
    changes,
  };

  try {
    const response = await apiFetch('/sync/push', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Push failed: ${response.status}`);

    const result = (await response.json()) as SyncPushResponse;
    const accepted = new Set(result.accepted.map(item => `${item.entity_type}:${item.entity_id}`));
    const conflicts = new Set(result.conflicts.map(item => `${item.entity_type}:${item.entity_id}`));

    await applyAcceptedVersions(result.accepted);

    await db.transaction('rw', db.sync_outbox, async () => {
      for (const entry of entries) {
        if (entry.id === undefined) continue;
        const key = `${entry.entity_type}:${entry.entity_id}`;
        if (accepted.has(key)) {
          await db.sync_outbox.delete(entry.id);
        } else if (conflicts.has(key)) {
          await db.sync_outbox.update(entry.id, {
            status: 'failed',
            attempts: entry.attempts + 1,
            last_error: 'conflict',
            updated_at: now(),
          });
        }
      }
    });

    return { ...result, backfilled, queued: entries.length };
  } catch (error) {
    await markOutboxFailed(entries, error instanceof Error ? error.message : 'sync failed');
    throw error;
  }
}

export async function pullRemoteChanges(): Promise<SyncPullResponse | null> {
  if (!localStorage.getItem(ACCESS_TOKEN_KEY)) return null;

  const cursorKey = syncCursorKey();
  const cursor = (await db.sync_meta.get(cursorKey))?.value ?? '0';
  const response = await apiFetch(`/sync/pull?cursor=${encodeURIComponent(cursor)}`);
  if (!response.ok) throw new Error(`Pull failed: ${response.status}`);

  const result = (await response.json()) as SyncPullResponse;
  for (const change of result.changes) {
    await applyRemoteChange(change);
  }

  await db.sync_meta.put({
    key: cursorKey,
    value: result.cursor,
    updated_at: now(),
  });

  return result;
}

export async function syncNow(): Promise<{
  pushed: number;
  conflicts: number;
  pulled: number;
  localItems: number;
  queued: number;
  backfilled: number;
} | null> {
  if (!(await ensureSyncIdentity())) return null;
  if (syncInProgress) {
    return {
      pushed: 0,
      conflicts: 0,
      pulled: 0,
      localItems: await db.items.count(),
      queued: await db.sync_outbox.where('status').anyOf('pending', 'failed', 'syncing').count(),
      backfilled: 0,
    };
  }

  syncInProgress = true;
  try {
  const localItems = await db.items.count();
  const push = await pushLocalChanges();
  const pull = await pullRemoteChanges();
  return {
    pushed: push?.accepted.length ?? 0,
    conflicts: push?.conflicts.length ?? 0,
    pulled: pull?.changes.length ?? 0,
    localItems,
    queued: push?.queued ?? 0,
    backfilled: push?.backfilled ?? 0,
  };
  } finally {
    syncInProgress = false;
  }
}

export function startBackgroundSync(): void {
  if (backgroundSyncTimer !== undefined) return;

  window.addEventListener('online', () => {
    void syncNow().catch(() => {});
  });
  backgroundSyncTimer = window.setInterval(() => {
    void syncNow().catch(() => {});
  }, BACKGROUND_SYNC_INTERVAL_MS);

  void syncNow().catch(() => {});
}
