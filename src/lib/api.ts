import { apiRequest } from "./queryClient";
import type { Bus, BusRoute, BusStop, InsertBus, InsertBusRoute, InsertBusStop, UpdateBusLocation } from "@shared/schema";

// Bus API functions
export const busApi = {
  getAll: async (): Promise<Bus[]> => {
    const res = await apiRequest('GET', '/api/buses');
    return res.json();
  },
  
  getActive: async (): Promise<Bus[]> => {
    const res = await apiRequest('GET', '/api/buses/active');
    return res.json();
  },
  
  getByRoute: async (routeId: string): Promise<Bus[]> => {
    const res = await apiRequest('GET', `/api/buses/route/${routeId}`);
    return res.json();
  },
  
  create: async (bus: InsertBus): Promise<Bus> => {
    const res = await apiRequest('POST', '/api/buses', bus);
    return res.json();
  },
  
  updateLocation: async (id: string, update: Omit<UpdateBusLocation, 'id'>): Promise<Bus> => {
    const res = await apiRequest('PATCH', `/api/buses/${id}/location`, update);
    return res.json();
  }
};

// Route API functions
export const routeApi = {
  getAll: async (): Promise<BusRoute[]> => {
    const res = await apiRequest('GET', '/api/routes');
    return res.json();
  },
  
  create: async (route: InsertBusRoute): Promise<BusRoute> => {
    const res = await apiRequest('POST', '/api/routes', route);
    return res.json();
  }
};

// Bus stop API functions
export const busStopApi = {
  getAll: async (): Promise<BusStop[]> => {
    const res = await apiRequest('GET', '/api/bus-stops');
    return res.json();
  },
  
  getByRoute: async (routeId: string): Promise<BusStop[]> => {
    const res = await apiRequest('GET', `/api/bus-stops/route/${routeId}`);
    return res.json();
  },
  
  create: async (stop: InsertBusStop): Promise<BusStop> => {
    const res = await apiRequest('POST', '/api/bus-stops', stop);
    return res.json();
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
    const res = await apiRequest('GET', `/api/arrivals/${stopId}`);
    return res.json();
  }
};