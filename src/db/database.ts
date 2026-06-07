import Dexie, { type EntityTable } from 'dexie';
import type {
  Item,
  Category,
  Channel,
  Field,
  ItemFieldValue,
  Location,
  Photo,
  SyncMeta,
  SyncOutboxEntry,
} from '../types';
import { SCHEMA_V1, SCHEMA_V2 } from './schema';

export class MetidyDatabase extends Dexie {
  items!: EntityTable<Item, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  channels!: EntityTable<Channel, 'id'>;
  fields!: EntityTable<Field, 'id'>;
  item_field_values!: EntityTable<ItemFieldValue, 'id'>;
  locations!: EntityTable<Location, 'id'>;
  photos!: EntityTable<Photo, 'id'>;
  sync_outbox!: EntityTable<SyncOutboxEntry, 'id'>;
  sync_meta!: EntityTable<SyncMeta, 'key'>;

  constructor() {
    super('metidy');
    this.version(1).stores(SCHEMA_V1);
    this.version(2).stores(SCHEMA_V2).upgrade(async tx => {
      await tx.table('item_field_values').toCollection().modify(row => {
        if (!row.id) row.id = crypto.randomUUID();
      });
    });
  }
}

export const db = new MetidyDatabase();
