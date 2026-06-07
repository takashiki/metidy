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
const SYNC_CURSOR_KEY = 'sync.cursor';
const BACKGROUND_SYNC_INTERVAL_MS = 30_000;

let applyingRemoteChange = false;
let backgroundSyncTimer: number | undefined;

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
  return response;
}

export function isSyncConfigured(): boolean {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY) && localStorage.getItem(DEVICE_ID_KEY));
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

export async function pushLocalChanges(): Promise<SyncPushResponse | null> {
  const deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId || !localStorage.getItem(ACCESS_TOKEN_KEY)) return null;

  const entries = await db.sync_outbox
    .where('status')
    .anyOf('pending', 'failed')
    .limit(500)
    .toArray();
  if (entries.length === 0) return { accepted: [], conflicts: [] };

  const timestamp = now();
  await db.transaction('rw', db.sync_outbox, async () => {
    for (const entry of entries) {
      if (entry.id !== undefined) {
        await db.sync_outbox.update(entry.id, { status: 'syncing', updated_at: timestamp });
      }
    }
  });

  const request: SyncPushRequest = {
    device_id: deviceId,
    changes: entries.map(outboxToChange),
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

    return result;
  } catch (error) {
    await markOutboxFailed(entries, error instanceof Error ? error.message : 'sync failed');
    throw error;
  }
}

export async function pullRemoteChanges(): Promise<SyncPullResponse | null> {
  if (!localStorage.getItem(ACCESS_TOKEN_KEY)) return null;

  const cursor = (await db.sync_meta.get(SYNC_CURSOR_KEY))?.value ?? '0';
  const response = await apiFetch(`/sync/pull?cursor=${encodeURIComponent(cursor)}`);
  if (!response.ok) throw new Error(`Pull failed: ${response.status}`);

  const result = (await response.json()) as SyncPullResponse;
  for (const change of result.changes) {
    await applyRemoteChange(change);
  }

  await db.sync_meta.put({
    key: SYNC_CURSOR_KEY,
    value: result.cursor,
    updated_at: now(),
  });

  return result;
}

export async function syncNow(): Promise<void> {
  if (!isSyncConfigured()) return;
  await pushLocalChanges();
  await pullRemoteChanges();
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
