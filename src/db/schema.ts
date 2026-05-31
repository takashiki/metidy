export const SCHEMA_V1 = {
  items:              'id, name, category_id, status, location_id, channel_id, acquired_date',
  categories:         'id, name, parent_id, sort_order',
  channels:           'id, name, sort_order',
  fields:             'id, category_id, key, data_type, sort_order',
  item_field_values:  '[item_id+field_id], item_id, field_id',
  locations:          'id, name, parent_id, type',
  photos:             'id, item_id, is_primary',
};