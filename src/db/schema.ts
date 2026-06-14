export const SCHEMA_V1 = {
  items:              'id, name, category_id, status, location_id, channel_id, acquired_date',
  categories:         'id, name, parent_id, sort_order',
  channels:           'id, name, sort_order',
  fields:             'id, category_id, key, data_type, sort_order',
  item_field_values:  '[item_id+field_id], item_id, field_id',
  locations:          'id, name, parent_id, type',
  photos:             'id, item_id, is_primary',
};

export const SCHEMA_V2 = {
  ...SCHEMA_V1,
  item_field_values:  'id, [item_id+field_id], item_id, field_id',
  sync_outbox:        '++id, entity_type, entity_id, status, created_at, updated_at',
  sync_meta:          '&key',
};

export const SCHEMA_V3 = {
  ...SCHEMA_V2,
  categories:         'id, template_key, name, parent_id, sort_order',
  channels:           'id, template_key, name, sort_order',
  fields:             'id, template_key, category_id, key, data_type, sort_order',
};

export const SCHEMA_V4 = {
  ...SCHEMA_V3,
  items:              'id, name, category_id, status, needs_restock, location_id, channel_id, acquired_date',
};
