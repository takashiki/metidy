import { useLiveQuery } from './useLiveQuery';
import { getFieldsByCategory, getGlobalFields } from '../services/fieldService';
import type { FieldDefinition } from '../types';

export function useFieldsForCategory(categoryId?: string): FieldDefinition[] | undefined {
  return useLiveQuery(
    () => categoryId ? getFieldsByCategory(categoryId) : Promise.resolve([]),
    [categoryId]
  );
}

export function useGlobalFields(): FieldDefinition[] | undefined {
  return useLiveQuery(() => getGlobalFields());
}