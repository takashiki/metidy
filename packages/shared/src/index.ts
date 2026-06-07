export type ItemStatus = '在用' | '闲置' | '已出' | '已弃' | '借出';
export type Importance = '低' | '中' | '高' | '关键';
export type DataType = 'text' | 'number' | 'date' | 'enum' | 'boolean';
export type LocationType = '房间' | '家具' | '容器';

export type SyncEntityType =
  | 'item'
  | 'category'
  | 'location'
  | 'channel'
  | 'field'
  | 'item_field_value'
  | 'photo';

export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncChange {
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperation;
  version?: number;
  base_version?: number;
  changed_at?: string;
  payload: Record<string, unknown>;
}

export interface SyncPushRequest {
  device_id: string;
  changes: SyncChange[];
}

export interface SyncPushResponse {
  accepted: Array<{
    entity_type: SyncEntityType;
    entity_id: string;
    version: number;
  }>;
  conflicts: Array<{
    entity_type: SyncEntityType;
    entity_id: string;
    server_version: number;
    server_payload: Record<string, unknown>;
  }>;
}

export interface SyncPullResponse {
  cursor: string;
  changes: SyncChange[];
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  device_id: string;
  user: AuthUser;
}
