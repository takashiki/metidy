import { useLiveQuery } from './useLiveQuery';
import { getLocationTree } from '../services/locationService';
import type { LocationTreeNode } from '../types';

export function useLocationTree(): LocationTreeNode[] | undefined {
  return useLiveQuery(() => getLocationTree());
}