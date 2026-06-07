export type ItemStatus = '在用' | '闲置' | '已出' | '已弃' | '借出';
export type Importance = '低' | '中' | '高' | '关键';
export type DataType = 'text' | 'number' | 'date' | 'enum' | 'boolean';
export type LocationType = '房间' | '家具' | '容器';

export const DEFAULT_DATA_IDS = {
  cat_appliance: 'cat-001',
  cat_consumable: 'cat-002',
  cat_electronics: 'cat-003',
  cat_books: 'cat-004',
  cat_clothing: 'cat-005',
  cat_tools: 'cat-006',
  ch_jd: 'ch-001',
  ch_taobao: 'ch-002',
  ch_pdd: 'ch-003',
  ch_xianyu: 'ch-004',
  ch_offline: 'ch-005',
  fld_plug_type: 'fld-001',
  fld_power: 'fld-002',
  fld_room: 'fld-003',
  fld_fixed: 'fld-004',
  fld_maintain: 'fld-005',
  fld_expiry: 'fld-006',
  fld_open_shelf: 'fld-007',
  fld_stock_warn: 'fld-008',
  fld_serial: 'fld-009',
  fld_charge: 'fld-010',
  fld_firmware: 'fld-011',
  fld_author: 'fld-012',
  fld_isbn: 'fld-013',
  fld_read: 'fld-014',
  fld_size: 'fld-015',
  fld_season: 'fld-016',
  fld_wash: 'fld-017',
} as const;

export const DEFAULT_CATEGORIES = [
  { id: DEFAULT_DATA_IDS.cat_appliance, name: '家用电器', icon: '⚡', sort_order: 1 },
  { id: DEFAULT_DATA_IDS.cat_consumable, name: '消耗品', icon: '🧴', sort_order: 2 },
  { id: DEFAULT_DATA_IDS.cat_electronics, name: '电子设备', icon: '📱', sort_order: 3 },
  { id: DEFAULT_DATA_IDS.cat_books, name: '书籍', icon: '📚', sort_order: 4 },
  { id: DEFAULT_DATA_IDS.cat_clothing, name: '衣物', icon: '👔', sort_order: 5 },
  { id: DEFAULT_DATA_IDS.cat_tools, name: '工具', icon: '🔧', sort_order: 6 },
] as const;

export const DEFAULT_CHANNELS = [
  { id: DEFAULT_DATA_IDS.ch_jd, name: '京东', sort_order: 1, usage_count: 0 },
  { id: DEFAULT_DATA_IDS.ch_taobao, name: '淘宝', sort_order: 2, usage_count: 0 },
  { id: DEFAULT_DATA_IDS.ch_pdd, name: '拼多多', sort_order: 3, usage_count: 0 },
  { id: DEFAULT_DATA_IDS.ch_xianyu, name: '闲鱼', sort_order: 4, usage_count: 0 },
  { id: DEFAULT_DATA_IDS.ch_offline, name: '线下', sort_order: 5, usage_count: 0 },
] as const;

export const DEFAULT_FIELDS = [
  { id: DEFAULT_DATA_IDS.fld_plug_type, category_id: DEFAULT_DATA_IDS.cat_appliance, key: 'plug_type', label: '插座类型', data_type: 'enum', options: ['两脚', '三脚', 'USB'], required: false, sort_order: 1 },
  { id: DEFAULT_DATA_IDS.fld_power, category_id: DEFAULT_DATA_IDS.cat_appliance, key: 'power', label: '功率', data_type: 'number', unit: 'W', required: false, sort_order: 2 },
  { id: DEFAULT_DATA_IDS.fld_room, category_id: DEFAULT_DATA_IDS.cat_appliance, key: 'room', label: '安装房间', data_type: 'enum', options: ['客厅', '主卧', '次卧', '厨房', '卫生间', '阳台'], required: false, sort_order: 3 },
  { id: DEFAULT_DATA_IDS.fld_fixed, category_id: DEFAULT_DATA_IDS.cat_appliance, key: 'fixed_install', label: '是否需固定安装', data_type: 'boolean', required: false, sort_order: 4 },
  { id: DEFAULT_DATA_IDS.fld_maintain, category_id: DEFAULT_DATA_IDS.cat_appliance, key: 'maintain_cycle', label: '保养周期', data_type: 'number', unit: '月', required: false, sort_order: 5 },
  { id: DEFAULT_DATA_IDS.fld_expiry, category_id: DEFAULT_DATA_IDS.cat_consumable, key: 'expiry_date', label: '保质期至', data_type: 'date', required: false, sort_order: 1 },
  { id: DEFAULT_DATA_IDS.fld_open_shelf, category_id: DEFAULT_DATA_IDS.cat_consumable, key: 'open_shelf_life', label: '开封后保质', data_type: 'number', unit: '天', required: false, sort_order: 2 },
  { id: DEFAULT_DATA_IDS.fld_stock_warn, category_id: DEFAULT_DATA_IDS.cat_consumable, key: 'stock_warn_threshold', label: '囤货量预警阈值', data_type: 'number', required: false, sort_order: 3 },
  { id: DEFAULT_DATA_IDS.fld_serial, category_id: DEFAULT_DATA_IDS.cat_electronics, key: 'serial_number', label: '序列号', data_type: 'text', required: false, sort_order: 1 },
  { id: DEFAULT_DATA_IDS.fld_charge, category_id: DEFAULT_DATA_IDS.cat_electronics, key: 'charge_port', label: '充电接口', data_type: 'enum', options: ['USB-C', 'Lightning', 'Micro-USB', 'USB-A'], required: false, sort_order: 2 },
  { id: DEFAULT_DATA_IDS.fld_firmware, category_id: DEFAULT_DATA_IDS.cat_electronics, key: 'firmware_version', label: '固件/系统版本', data_type: 'text', required: false, sort_order: 3 },
  { id: DEFAULT_DATA_IDS.fld_author, category_id: DEFAULT_DATA_IDS.cat_books, key: 'author', label: '作者', data_type: 'text', required: false, sort_order: 1 },
  { id: DEFAULT_DATA_IDS.fld_isbn, category_id: DEFAULT_DATA_IDS.cat_books, key: 'isbn', label: 'ISBN', data_type: 'text', required: false, sort_order: 2 },
  { id: DEFAULT_DATA_IDS.fld_read, category_id: DEFAULT_DATA_IDS.cat_books, key: 'is_read', label: '读完', data_type: 'boolean', required: false, sort_order: 3 },
  { id: DEFAULT_DATA_IDS.fld_size, category_id: DEFAULT_DATA_IDS.cat_clothing, key: 'size', label: '尺码', data_type: 'text', required: false, sort_order: 1 },
  { id: DEFAULT_DATA_IDS.fld_season, category_id: DEFAULT_DATA_IDS.cat_clothing, key: 'season', label: '季节', data_type: 'enum', options: ['春', '夏', '秋', '冬', '全年'], required: false, sort_order: 2 },
  { id: DEFAULT_DATA_IDS.fld_wash, category_id: DEFAULT_DATA_IDS.cat_clothing, key: 'wash_method', label: '洗涤方式', data_type: 'text', required: false, sort_order: 3 },
] as const;

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
