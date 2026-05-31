import Dexie, { type EntityTable } from 'dexie';
import type { Item, Category, Channel, Field, ItemFieldValue, Location, Photo } from '../types';
import { SCHEMA_V1 } from './schema';

export class MetidyDatabase extends Dexie {
  items!: EntityTable<Item, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  channels!: EntityTable<Channel, 'id'>;
  fields!: EntityTable<Field, 'id'>;
  item_field_values!: EntityTable<ItemFieldValue>;
  locations!: EntityTable<Location, 'id'>;
  photos!: EntityTable<Photo, 'id'>;

  constructor() {
    super('metidy');
    this.version(1).stores(SCHEMA_V1);
  }
}

export const db = new MetidyDatabase();