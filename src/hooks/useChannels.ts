import { useLiveQuery } from './useLiveQuery';
import { getAllChannels } from '../services/channelService';
import type { Channel } from '../types';

export function useChannels(): Channel[] | undefined {
  return useLiveQuery(() => getAllChannels());
}