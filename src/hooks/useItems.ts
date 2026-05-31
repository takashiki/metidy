import { useLiveQuery } from './useLiveQuery';
import { listItems, getItemDetail } from '../services/itemService';
import type { ItemDetail, ItemListItem, ItemFilter } from '../types';

export function useItemList(filter?: ItemFilter): ItemListItem[] | undefined {
  return useLiveQuery(() => listItems(filter), [JSON.stringify(filter)]);
}

export function useItemDetail(id?: string): ItemDetail | null | undefined {
  return useLiveQuery(
    () => id ? getItemDetail(id) : Promise.resolve(null),
    [id]
  );
}