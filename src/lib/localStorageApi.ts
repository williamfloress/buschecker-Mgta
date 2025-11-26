import type { Bus, BusStop, BusRoute } from "@shared/schema";

// Storage keys
const STORAGE_KEYS = {
  buses: 'margarita-buses',
  busStops: 'margarita-bus-stops',
  routes: 'margarita-routes',
};

// Initialize with default Isla de Margarita data
const defaultRoutes: BusRoute[] = [
  {
    id: 'RA-1',
    routeNumber: 'RA-1',
    routeName: 'Ruta Norte - Playas (Playa El Agua)',
    color: '#2563eb'
  },
  {
    id: 'RA-2',
    routeNumber: 'RA-2',
    routeName: 'Ruta Sur - Deportes Acuáticos (Playa El Yaque)',
    color: '#16a34a'
  },
  {
    id: 'RA-3',
    routeNumber: 'RA-3',
    routeName: 'Ruta Este - Surf y Aventura (Playa Parguito)',
    color: '#dc2626'
  },
  {
    id: 'RA-4',
    routeNumber: 'RA-4',
    routeName: 'Ruta Oeste - Playa Caribe',
    color: '#ca8a04'
  },
  {
    id: 'RA-5',
    routeNumber: 'RA-5',
    routeName: 'Ruta Central - La Restinga',
    color: '#7c3aed'
  }
];

const defaultBusStops: BusStop[] = [
  // Playa El Agua stops (RA-1)
  { id: 'stop-1', name: 'Terminal Porlamar', routeId: 'RA-1', latitude: 10.9577, longitude: -63.8497 },
  { id: 'stop-2', name: 'Centro Comercial Sambil', routeId: 'RA-1', latitude: 10.9699, longitude: -63.8456 },
  { id: 'stop-3', name: 'Playa El Agua Norte', routeId: 'RA-1', latitude: 11.0894, longitude: -63.9235 },
  
  // Playa El Yaque stops (RA-2)
  { id: 'stop-4', name: 'Aeropuerto Internacional', routeId: 'RA-2', latitude: 10.9129, longitude: -63.9666 },
  { id: 'stop-5', name: 'Costa Azul', routeId: 'RA-2', latitude: 10.8934, longitude: -63.9445 },
  { id: 'stop-6', name: 'Playa El Yaque Kitesurf', routeId: 'RA-2', latitude: 10.8756, longitude: -63.9356 },
  
  // Playa Parguito stops (RA-3)
  { id: 'stop-7', name: 'La Asunción Centro', routeId: 'RA-3', latitude: 11.0337, longitude: -63.8625 },
  { id: 'stop-8', name: 'Mirador Cerro Copey', routeId: 'RA-3', latitude: 11.0756, longitude: -63.8234 },
  { id: 'stop-9', name: 'Playa Parguito Surf Point', routeId: 'RA-3', latitude: 11.0923, longitude: -63.8567 },
  
  // Playa Caribe stops (RA-4)
  { id: 'stop-10', name: 'Juan Griego Puerto', routeId: 'RA-4', latitude: 11.0834, longitude: -63.9687 },
  { id: 'stop-11', name: 'Fortín La Galera', routeId: 'RA-4', latitude: 11.0945, longitude: -63.9823 },
  { id: 'stop-12', name: 'Playa Caribe Oeste', routeId: 'RA-4', latitude: 11.0678, longitude: -64.0134 },
  
  // La Restinga stops (RA-5)
  { id: 'stop-13', name: 'Boca de Río', routeId: 'RA-5', latitude: 10.8945, longitude: -64.0567 },
  { id: 'stop-14', name: 'Embarcadero La Restinga', routeId: 'RA-5', latitude: 10.8234, longitude: -64.0923 }
];

const defaultBuses: Bus[] = [
  {
    id: 'bus-1',
    routeId: 'RA-1',
    driverName: 'Carlos Rodríguez',
    latitude: 10.9577,
    longitude: -63.8497,
    isActive: true,
    lastUpdate: new Date()
  },
  {
    id: 'bus-2',
    routeId: 'RA-2',
    driverName: 'María González',
    latitude: 10.9129,
    longitude: -63.9666,
    isActive: true,
    lastUpdate: new Date()
  },
  {
    id: 'bus-3',
    routeId: 'RA-3',
    driverName: 'José Hernández',
    latitude: 11.0337,
    longitude: -63.8625,
    isActive: false,
    lastUpdate: new Date()
  },
  {
    id: 'bus-4',
    routeId: 'RA-4',
    driverName: 'Ana Morales',
    latitude: 11.0834,
    longitude: -63.9687,
    isActive: true,
    lastUpdate: new Date()
  },
  {
    id: 'bus-5',
    routeId: 'RA-5',
    driverName: 'Luis Pérez',
    latitude: 10.8945,
    longitude: -64.0567,
    isActive: false,
    lastUpdate: new Date()
  }
];

// Initialize localStorage with default data if empty
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.routes)) {
    localStorage.setItem(STORAGE_KEYS.routes, JSON.stringify(defaultRoutes));
  }
  if (!localStorage.getItem(STORAGE_KEYS.busStops)) {
    localStorage.setItem(STORAGE_KEYS.busStops, JSON.stringify(defaultBusStops));
  }
  if (!localStorage.getItem(STORAGE_KEYS.buses)) {
    localStorage.setItem(STORAGE_KEYS.buses, JSON.stringify(defaultBuses));
  }
}

// Routes API
export const routeApi = {
  getAll: (): Promise<BusRoute[]> => {
    initializeStorage();
    const routes = localStorage.getItem(STORAGE_KEYS.routes);
    return Promise.resolve(routes ? JSON.parse(routes) : []);
  }
};

// Bus Stops API
export const busStopApi = {
  getAll: (): Promise<BusStop[]> => {
    initializeStorage();
    const stops = localStorage.getItem(STORAGE_KEYS.busStops);
    return Promise.resolve(stops ? JSON.parse(stops) : []);
  },
  
  getByRoute: (routeId: string): Promise<BusStop[]> => {
    return busStopApi.getAll().then(stops => 
      stops.filter(stop => stop.routeId === routeId)
    );
  }
};

// Buses API
export const busApi = {
  getAll: (): Promise<Bus[]> => {
    initializeStorage();
    const buses = localStorage.getItem(STORAGE_KEYS.buses);
    return Promise.resolve(buses ? JSON.parse(buses) : []);
  },
  
  getActive: (): Promise<Bus[]> => {
    return busApi.getAll().then(buses => 
      buses.filter(bus => bus.isActive)
    );
  },
  
  getById: (id: string): Promise<Bus | null> => {
    return busApi.getAll().then(buses => 
      buses.find(bus => bus.id === id) || null
    );
  },
  
  update: (id: string, updateData: Partial<Bus>): Promise<Bus> => {
    return busApi.getAll().then(buses => {
      const index = buses.findIndex(bus => bus.id === id);
      if (index === -1) {
        throw new Error('Bus not found');
      }
      
      const updatedBus = { 
        ...buses[index], 
        ...updateData,
        lastUpdate: new Date()
      };
      buses[index] = updatedBus;
      
      localStorage.setItem(STORAGE_KEYS.buses, JSON.stringify(buses));
      return updatedBus;
    });
  },
  
  create: (busData: Omit<Bus, 'id' | 'lastUpdate'>): Promise<Bus> => {
    return busApi.getAll().then(buses => {
      const newBus: Bus = {
        ...busData,
        id: `bus-${Date.now()}`,
        lastUpdate: new Date()
      };
      
      buses.push(newBus);
      localStorage.setItem(STORAGE_KEYS.buses, JSON.stringify(buses));
      return newBus;
    });
  },

  updateLocation: (busId: string, latitude: number, longitude: number, isActive?: boolean): Promise<Bus> => {
    return busApi.getAll().then(buses => {
      const index = buses.findIndex(bus => bus.id === busId);
      if (index === -1) {
        throw new Error('Bus not found');
      }
      
      const updatedBus = { 
        ...buses[index], 
        latitude,
        longitude,
        isActive: isActive !== undefined ? isActive : buses[index].isActive,
        lastUpdate: new Date()
      };
      buses[index] = updatedBus;
      
      localStorage.setItem(STORAGE_KEYS.buses, JSON.stringify(buses));
      return updatedBus;
    });
  }
};

// Initialize storage on import
initializeStorage();