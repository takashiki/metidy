// ---- Enums (string unions) ----
export type ItemStatus = '在用' | '闲置' | '已出' | '已弃' | '借出';
export type Importance = '低' | '中' | '高' | '关键';
export type DataType = 'text' | 'number' | 'date' | 'enum' | 'boolean';
export type LocationType = '房间' | '家具' | '容器';

// ---- Database tables ----
export interface Item {
  id: string;
  name: string;
  category_id: string;
  quantity: number;
  status: ItemStatus;
  location_id?: string;
  channel_id?: string;
  acquired_date?: string;
  price?: number;
  currency: string;
  rating?: number;
  importance?: Importance;
  warranty_until?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version?: number;
}

export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  icon?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  version?: number;
}

export interface Channel {
  id: string;
  name: string;
  icon?: string;
  sort_order: number;
  usage_count: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  version?: number;
}

export interface Field {
  id: string;
  category_id?: string;
  key: string;
  label: string;
  data_type: DataType;
  options?: string[];
  unit?: string;
  required: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  version?: number;
}

export interface ItemFieldValue {
  id: string;
  item_id: string;
  field_id: string;
  value: any;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  version?: number;
}

export interface Location {
  id: string;
  name: string;
  parent_id?: string;
  type: LocationType;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  version?: number;
}

export interface Photo {
  id: string;
  item_id: string;
  blob?: Blob;
  object_key?: string;
  mime_type?: string;
  size?: number;
  width?: number;
  height?: number;
  is_primary: boolean;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  version?: number;
}

export type SyncEntityType =
  | 'item'
  | 'category'
  | 'location'
  | 'channel'
  | 'field'
  | 'item_field_value'
  | 'photo';

export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncOutboxStatus = 'pending' | 'syncing' | 'failed';

export interface SyncOutboxEntry {
  id?: number;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperation;
  base_version?: number;
  payload: Record<string, unknown>;
  status: SyncOutboxStatus;
  attempts: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncMeta {
  key: string;
  value: string;
  updated_at: string;
}

// ---- Composite / display types ----
// FieldDefinition is the API-layer alias for Field (used in service layer returns)
export type FieldDefinition = Field;

export interface ItemDetail extends Item {
  category_name?: string;
  location_name?: string;
  channel_name?: string;
  custom_fields?: Record<string, any>;
  photos?: Photo[];
}

export interface ItemListItem {
  id: string;
  name: string;
  category_id: string;
  category_name?: string;
  status: ItemStatus;
  location_name?: string;
  rating?: number;
  importance?: Importance;
  created_at: string;
  display_label: string;
}

export interface ItemFormData {
  name: string;
  category_id: string;
  quantity: number;
  status: ItemStatus;
  location_id?: string;
  channel_id?: string;
  acquired_date?: string;
  price?: number;
  currency?: string;
  rating?: number;
  importance?: Importance;
  warranty_until?: string;
  notes?: string;
  custom_fields?: Record<string, any>;
}

export interface ItemFilter {
  search?: string;
  category_id?: string;
  status?: ItemStatus;
  location_id?: string;
  channel_id?: string;
}

export interface LocationTreeNode extends Location {
  children: LocationTreeNode[];
  item_count: number;
}
