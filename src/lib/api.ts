import { 
  lineaService, 
  paradaService, 
  unidadService, 
  posicionService 
} from './services';
import type { Bus, BusRoute, BusStop, InsertBus, InsertBusRoute, InsertBusStop, UpdateBusLocation } from "@shared/schema";

// Map Supabase schema to frontend types
const mapUnidadToBus = (unidad: any): Bus => ({
  id: unidad.id_unidad,
  routeId: unidad.id_linea,
  driverName: unidad.unidad_conductor?.[0]?.usuarios?.nombre || unidad.unidad_conductor?.usuarios?.nombre || 'Sin conductor',
  latitude: unidad.posicion_actual?.latitud || 0,
  longitude: unidad.posicion_actual?.longitud || 0,
  isActive: unidad.is_active,
  lastUpdate: new Date(unidad.posicion_actual?.timestamp || Date.now())
});

const mapLineaToBusRoute = (linea: any): BusRoute => ({
  id: linea.id_linea,
  routeNumber: linea.nombre.split(' ')[0] || linea.nombre,
  routeName: linea.nombre,
  color: linea.color || '#2563eb'
});

const mapParadaToBusStop = (parada: any): BusStop => ({
  id: parada.id_parada,
  name: parada.nombre,
  latitude: parada.latitud,
  longitude: parada.longitud,
  routeId: null // Will be set from ruta_parada relationship
});

// Bus API functions
export const busApi = {
  getAll: async (): Promise<Bus[]> => {
    const unidades = await unidadService.getAll();
    return unidades.map(mapUnidadToBus);
  },
  
  getActive: async (): Promise<Bus[]> => {
    const unidades = await unidadService.getActive();
    return unidades.map(mapUnidadToBus);
  },
  
  getByRoute: async (routeId: string): Promise<Bus[]> => {
    const unidades = await unidadService.getByLine(routeId);
    return unidades.map(mapUnidadToBus);
  },
  
  create: async (bus: InsertBus): Promise<Bus> => {
    const unidad = await unidadService.create({
      id_linea: bus.routeId,
      placa: `BUS-${Date.now()}`,
      modelo: 'Unknown',
      is_active: bus.isActive || false
    });
    return mapUnidadToBus(unidad);
  },
  
  updateLocation: async (id: string, update: Omit<UpdateBusLocation, 'id'>): Promise<Bus> => {
    await posicionService.updatePosition(id, {
      latitud: update.latitude,
      longitud: update.longitude,
      velocidad: 0,
      status: update.isActive ? 'en_ruta' : 'detenido'
    });
    
    // Update unit active status
    await unidadService.updateActiveStatus(id, update.isActive);
    
    const unidad = await unidadService.getById(id);
    return mapUnidadToBus(unidad);
  }
};

// Route API functions
export const routeApi = {
  getAll: async (): Promise<BusRoute[]> => {
    const lineas = await lineaService.getAll();
    return lineas.map(mapLineaToBusRoute);
  },
  
  create: async (route: InsertBusRoute): Promise<BusRoute> => {
    const linea = await lineaService.create({
      nombre: route.routeName,
      tarifa: 0,
      color: route.color || '#2563eb'
    });
    return mapLineaToBusRoute(linea);
  }
};

// Bus stop API functions
export const busStopApi = {
  getAll: async (): Promise<BusStop[]> => {
    const paradas = await paradaService.getAll();
    return paradas.map(mapParadaToBusStop);
  },
  
  getByRoute: async (routeId: string): Promise<BusStop[]> => {
    const rutaParadas = await lineaService.getStopsByLine(routeId);
    return rutaParadas.map((rp: any) => mapParadaToBusStop(rp.paradas));
  },
  
  create: async (stop: InsertBusStop): Promise<BusStop> => {
    const parada = await paradaService.create({
      nombre: stop.name,
      latitud: stop.latitude,
      longitud: stop.longitude,
      direccion: null
    });
    return mapParadaToBusStop(parada);
  },

  update: async (id: string, stop: Partial<InsertBusStop>): Promise<BusStop> => {
    const parada = await paradaService.update(id, {
      nombre: stop.name!,
      latitud: stop.latitude!,
      longitud: stop.longitude!,
      direccion: null
    });
    return mapParadaToBusStop(parada);
  },

  delete: async (id: string): Promise<void> => {
    await paradaService.delete(id);
  }
};

// Arrival API functions
export const arrivalApi = {
  getForStop: async (stopId: string): Promise<{
    stopName: string;
    arrivals: Array<{
      busId: string;
      routeNumber: string;
      destination: string;
      estimatedMinutes: number;
      isDelayed: boolean;
      driverName: string;
    }>;
  }> => {
    const parada = await paradaService.getById(stopId);
    const allPositions = await posicionService.getAllCurrentPositions();
    
    // Calculate ETAs (simplified - in production use distance calculation)
    const arrivals = allPositions
      .filter((pos: any) => pos.unidades?.is_active)
      .map((pos: any) => ({
        busId: pos.id_unidad,
        routeNumber: pos.unidades?.lineas?.nombre || 'N/A',
        destination: pos.unidades?.lineas?.nombre || 'N/A',
        estimatedMinutes: Math.floor(Math.random() * 15) + 1, // Placeholder
        isDelayed: false,
        driverName: 'Conductor'
      }));
    
    return {
      stopName: parada.nombre,
      arrivals
    };
  }
};