/**
 * Unified API for PassengerView that supports both Supabase and localStorage.
 * Tries Supabase first; falls back to localStorage when Supabase has no data or fails.
 * Favorites work with both data sources (schema supports TEXT id_referencia).
 */
import { busApi as supabaseBusApi, busStopApi as supabaseBusStopApi } from './api';
import { busApi as localStorageBusApi, busStopApi as localStorageBusStopApi } from './localStorageApi';
import type { Bus, BusStop } from '@shared/schema';

let useSupabase: boolean | null = null;

async function detectDataSource(): Promise<'supabase' | 'localStorage'> {
  if (useSupabase !== null) return useSupabase ? 'supabase' : 'localStorage';

  try {
    const stops = await supabaseBusStopApi.getAll();
    useSupabase = stops.length > 0;
    return useSupabase ? 'supabase' : 'localStorage';
  } catch {
    useSupabase = false;
    return 'localStorage';
  }
}

export const passengerBusApi = {
  getActive: async (): Promise<Bus[]> => {
    const source = await detectDataSource();
    return source === 'supabase' ? supabaseBusApi.getActive() : localStorageBusApi.getActive();
  },
};

export const passengerBusStopApi = {
  getAll: async (): Promise<BusStop[]> => {
    const source = await detectDataSource();
    return source === 'supabase' ? supabaseBusStopApi.getAll() : localStorageBusStopApi.getAll();
  },
};
