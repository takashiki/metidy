import { useLiveQuery } from './useLiveQuery';
import { getAllCategories, getCategoryById } from '../services/categoryService';
import type { Category } from '../types';

export function useCategories(): Category[] | undefined {
  return useLiveQuery(() => getAllCategories());
}

export function useCategory(id?: string): Category | null | undefined {
  return useLiveQuery(() => id ? getCategoryById(id) : Promise.resolve(null), [id]);
}