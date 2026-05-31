import { useLiveQuery as dexieUseLiveQuery } from 'dexie-react-hooks';

export function useLiveQuery<T>(query: () => Promise<T>, deps: any[] = []): T | undefined {
  return dexieUseLiveQuery(query, deps);
}