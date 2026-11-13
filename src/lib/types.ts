// Tipos de dominio del frontend. Se mapean desde las tablas de Supabase en `api.ts`.
// TODO (Fase 1): sustituir por tipos generados con `supabase gen types typescript`.

export interface BusRoute {
  id: string;
  routeNumber: string;
  routeName: string;
  color: string;
}

export interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routeId: string | null;
}

export interface Bus {
  id: string;
  routeId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  lastUpdate: Date;
}

export type InsertBusRoute = Omit<BusRoute, "id" | "color"> & { color?: string };
export type InsertBusStop = Omit<BusStop, "id" | "routeId"> & { routeId?: string | null };
export type InsertBus = Omit<Bus, "id" | "lastUpdate" | "isActive"> & { isActive?: boolean };

export interface UpdateBusLocation {
  id: string;
  latitude: number;
  longitude: number;
  isActive?: boolean;
}
