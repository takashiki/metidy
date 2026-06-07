export type ItemStatus = '在用' | '闲置' | '已出' | '已弃' | '借出';
export type Importance = '低' | '中' | '高' | '关键';
export type DataType = 'text' | 'number' | 'date' | 'enum' | 'boolean';
export type LocationType = '房间' | '家具' | '容器';

export const DEFAULT_CATEGORY_TEMPLATES = [
  { template_key: 'appliance', name: '家用电器', icon: '⚡', sort_order: 1 },
  { template_key: 'consumable', name: '消耗品', icon: '🧴', sort_order: 2 },
  { template_key: 'electronics', name: '电子设备', icon: '📱', sort_order: 3 },
  { template_key: 'books', name: '书籍', icon: '📚', sort_order: 4 },
  { template_key: 'clothing', name: '衣物', icon: '👔', sort_order: 5 },
  { template_key: 'tools', name: '工具', icon: '🔧', sort_order: 6 },
] as const;

export const DEFAULT_CHANNEL_TEMPLATES = [
  { template_key: 'jd', name: '京东', sort_order: 1, usage_count: 0 },
  { template_key: 'taobao', name: '淘宝', sort_order: 2, usage_count: 0 },
  { template_key: 'pdd', name: '拼多多', sort_order: 3, usage_count: 0 },
  { template_key: 'xianyu', name: '闲鱼', sort_order: 4, usage_count: 0 },
  { template_key: 'offline', name: '线下', sort_order: 5, usage_count: 0 },
] as const;

export const DEFAULT_FIELD_TEMPLATES = [
  { template_key: 'appliance.plug_type', category_template_key: 'appliance', key: 'plug_type', label: '插座类型', data_type: 'enum', options: ['两脚', '三脚', 'USB'], required: false, sort_order: 1 },
  { template_key: 'appliance.power', category_template_key: 'appliance', key: 'power', label: '功率', data_type: 'number', unit: 'W', required: false, sort_order: 2 },
  { template_key: 'appliance.room', category_template_key: 'appliance', key: 'room', label: '安装房间', data_type: 'enum', options: ['客厅', '主卧', '次卧', '厨房', '卫生间', '阳台'], required: false, sort_order: 3 },
  { template_key: 'appliance.fixed_install', category_template_key: 'appliance', key: 'fixed_install', label: '是否需固定安装', data_type: 'boolean', required: false, sort_order: 4 },
  { template_key: 'appliance.maintain_cycle', category_template_key: 'appliance', key: 'maintain_cycle', label: '保养周期', data_type: 'number', unit: '月', required: false, sort_order: 5 },
  { template_key: 'consumable.expiry_date', category_template_key: 'consumable', key: 'expiry_date', label: '保质期至', data_type: 'date', required: false, sort_order: 1 },
  { template_key: 'consumable.open_shelf_life', category_template_key: 'consumable', key: 'open_shelf_life', label: '开封后保质', data_type: 'number', unit: '天', required: false, sort_order: 2 },
  { template_key: 'consumable.stock_warn_threshold', category_template_key: 'consumable', key: 'stock_warn_threshold', label: '囤货量预警阈值', data_type: 'number', required: false, sort_order: 3 },
  { template_key: 'electronics.serial_number', category_template_key: 'electronics', key: 'serial_number', label: '序列号', data_type: 'text', required: false, sort_order: 1 },
  { template_key: 'electronics.charge_port', category_template_key: 'electronics', key: 'charge_port', label: '充电接口', data_type: 'enum', options: ['USB-C', 'Lightning', 'Micro-USB', 'USB-A'], required: false, sort_order: 2 },
  { template_key: 'electronics.firmware_version', category_template_key: 'electronics', key: 'firmware_version', label: '固件/系统版本', data_type: 'text', required: false, sort_order: 3 },
  { template_key: 'books.author', category_template_key: 'books', key: 'author', label: '作者', data_type: 'text', required: false, sort_order: 1 },
  { template_key: 'books.isbn', category_template_key: 'books', key: 'isbn', label: 'ISBN', data_type: 'text', required: false, sort_order: 2 },
  { template_key: 'books.is_read', category_template_key: 'books', key: 'is_read', label: '读完', data_type: 'boolean', required: false, sort_order: 3 },
  { template_key: 'clothing.size', category_template_key: 'clothing', key: 'size', label: '尺码', data_type: 'text', required: false, sort_order: 1 },
  { template_key: 'clothing.season', category_template_key: 'clothing', key: 'season', label: '季节', data_type: 'enum', options: ['春', '夏', '秋', '冬', '全年'], required: false, sort_order: 2 },
  { template_key: 'clothing.wash_method', category_template_key: 'clothing', key: 'wash_method', label: '洗涤方式', data_type: 'text', required: false, sort_order: 3 },
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
