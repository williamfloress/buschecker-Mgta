import { 
  type User, type InsertUser,
  type Bus, type InsertBus, type UpdateBusLocation,
  type BusRoute, type InsertBusRoute,
  type BusStop, type InsertBusStop
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Bus operations
  getAllBuses(): Promise<Bus[]>;
  getBus(id: string): Promise<Bus | undefined>;
  getBusesByRoute(routeId: string): Promise<Bus[]>;
  getActiveBuses(): Promise<Bus[]>;
  createBus(bus: InsertBus): Promise<Bus>;
  updateBusLocation(update: UpdateBusLocation): Promise<Bus | undefined>;
  deleteBus(id: string): Promise<boolean>;

  // Route operations
  getAllRoutes(): Promise<BusRoute[]>;
  getRoute(id: string): Promise<BusRoute | undefined>;
  createRoute(route: InsertBusRoute): Promise<BusRoute>;
  deleteRoute(id: string): Promise<boolean>;

  // Bus stop operations
  getAllBusStops(): Promise<BusStop[]>;
  getBusStop(id: string): Promise<BusStop | undefined>;
  getBusStopsByRoute(routeId: string): Promise<BusStop[]>;
  createBusStop(stop: InsertBusStop): Promise<BusStop>;
  deleteBusStop(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private buses: Map<string, Bus>;
  private routes: Map<string, BusRoute>;
  private busStops: Map<string, BusStop>;

  constructor() {
    this.users = new Map();
    this.buses = new Map();
    this.routes = new Map();
    this.busStops = new Map();
    
    // Initialize with Isla de Margarita beach route data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create Margarita Island beach routes
    const rutaNorte: BusRoute = {
      id: randomUUID(),
      routeNumber: "RA-1",
      routeName: "Ruta Norte - Playas",
      color: "#0ea5e9"
    };
    const rutaSur: BusRoute = {
      id: randomUUID(),
      routeNumber: "RA-2", 
      routeName: "Ruta Sur - Deportes Acuáticos",
      color: "#16a34a"
    };
    const rutaEste: BusRoute = {
      id: randomUUID(),
      routeNumber: "RA-3",
      routeName: "Ruta Este - Surf y Aventura",
      color: "#dc2626"
    };
    const rutaOeste: BusRoute = {
      id: randomUUID(),
      routeNumber: "RA-4",
      routeName: "Ruta Oeste - Playa Caribe",
      color: "#7c3aed"
    };
    const rutaCentral: BusRoute = {
      id: randomUUID(),
      routeNumber: "RA-5",
      routeName: "Ruta Central - La Restinga",
      color: "#ea580c"
    };
    
    this.routes.set(rutaNorte.id, rutaNorte);
    this.routes.set(rutaSur.id, rutaSur);
    this.routes.set(rutaEste.id, rutaEste);
    this.routes.set(rutaOeste.id, rutaOeste);
    this.routes.set(rutaCentral.id, rutaCentral);

    // Create bus stops for Margarita Island beaches
    const stops: BusStop[] = [
      // Ruta Norte stops (Porlamar to Playa El Agua)
      {
        id: randomUUID(),
        name: "Terminal Porlamar",
        latitude: 10.9574,
        longitude: -63.8497,
        routeId: rutaNorte.id
      },
      {
        id: randomUUID(),
        name: "Plaza Bolívar",
        latitude: 10.9625,
        longitude: -63.8456,
        routeId: rutaNorte.id
      },
      {
        id: randomUUID(),
        name: "Centro Comercial Sambil",
        latitude: 10.9893,
        longitude: -63.8654,
        routeId: rutaNorte.id
      },
      {
        id: randomUUID(),
        name: "Playa El Agua - Entrada Principal",
        latitude: 11.1476,
        longitude: -63.8637,
        routeId: rutaNorte.id
      },
      // Ruta Sur stops (Aeropuerto to El Yaque)
      {
        id: randomUUID(),
        name: "Aeropuerto Santiago Mariño",
        latitude: 10.9097,
        longitude: -63.9663,
        routeId: rutaSur.id
      },
      {
        id: randomUUID(),
        name: "Hotel Hesperia",
        latitude: 10.9156,
        longitude: -63.9598,
        routeId: rutaSur.id
      },
      {
        id: randomUUID(),
        name: "Playa El Yaque - Centro Windsurf",
        latitude: 10.8982,
        longitude: -63.9613,
        routeId: rutaSur.id
      },
      // Ruta Este stops (Juan Griego to Parguito)
      {
        id: randomUUID(),
        name: "Juan Griego - Puerto",
        latitude: 11.0817,
        longitude: -63.9655,
        routeId: rutaEste.id
      },
      {
        id: randomUUID(),
        name: "Fortaleza La Galera",
        latitude: 11.0856,
        longitude: -63.9623,
        routeId: rutaEste.id
      },
      {
        id: randomUUID(),
        name: "Playa Parguito - Zona Surf",
        latitude: 11.1300,
        longitude: -63.8470,
        routeId: rutaEste.id
      },
      // Ruta Oeste stops (Juan Griego to Playa Caribe)
      {
        id: randomUUID(),
        name: "Juan Griego - Terminal",
        latitude: 11.0817,
        longitude: -63.9655,
        routeId: rutaOeste.id
      },
      {
        id: randomUUID(),
        name: "Mirador El Fortín",
        latitude: 11.0890,
        longitude: -63.9720,
        routeId: rutaOeste.id
      },
      {
        id: randomUUID(),
        name: "Playa Caribe - Entrada",
        latitude: 11.1100,
        longitude: -63.9703,
        routeId: rutaOeste.id
      },
      // Ruta Central stops (Porlamar to La Restinga)
      {
        id: randomUUID(),
        name: "Porlamar - Mercado",
        latitude: 10.9580,
        longitude: -63.8510,
        routeId: rutaCentral.id
      },
      {
        id: randomUUID(),
        name: "Boca de Río",
        latitude: 10.9850,
        longitude: -64.0200,
        routeId: rutaCentral.id
      },
      {
        id: randomUUID(),
        name: "Parque Nacional La Restinga",
        latitude: 11.0200,
        longitude: -64.0800,
        routeId: rutaCentral.id
      }
    ];
    
    stops.forEach(stop => this.busStops.set(stop.id, stop));

    // Create buses for Margarita Island routes
    const buses: Bus[] = [
      {
        id: randomUUID(),
        routeId: rutaNorte.id,
        driverName: "José Morales",
        latitude: 10.9574,
        longitude: -63.8497,
        isActive: true,
        lastUpdate: new Date()
      },
      {
        id: randomUUID(),
        routeId: rutaSur.id,
        driverName: "Carmen Vásquez",
        latitude: 10.8982,
        longitude: -63.9613,
        isActive: true,
        lastUpdate: new Date()
      },
      {
        id: randomUUID(),
        routeId: rutaEste.id,
        driverName: "Miguel Hernández",
        latitude: 11.0817,
        longitude: -63.9655,
        isActive: true,
        lastUpdate: new Date()
      },
      {
        id: randomUUID(),
        routeId: rutaNorte.id,
        driverName: "Ana Rodríguez",
        latitude: 11.1200,
        longitude: -63.8550,
        isActive: false,
        lastUpdate: new Date()
      },
      {
        id: randomUUID(),
        routeId: rutaOeste.id,
        driverName: "Carlos Mendoza",
        latitude: 11.0817,
        longitude: -63.9655,
        isActive: true,
        lastUpdate: new Date()
      },
      {
        id: randomUUID(),
        routeId: rutaCentral.id,
        driverName: "Isabel García",
        latitude: 10.9850,
        longitude: -64.0200,
        isActive: true,
        lastUpdate: new Date()
      }
    ];
    
    buses.forEach(bus => this.buses.set(bus.id, bus));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Bus operations
  async getAllBuses(): Promise<Bus[]> {
    return Array.from(this.buses.values());
  }

  async getBus(id: string): Promise<Bus | undefined> {
    return this.buses.get(id);
  }

  async getBusesByRoute(routeId: string): Promise<Bus[]> {
    return Array.from(this.buses.values()).filter(bus => bus.routeId === routeId);
  }

  async getActiveBuses(): Promise<Bus[]> {
    return Array.from(this.buses.values()).filter(bus => bus.isActive);
  }

  async createBus(insertBus: InsertBus): Promise<Bus> {
    const id = randomUUID();
    const bus: Bus = { ...insertBus, id, lastUpdate: new Date(), isActive: insertBus.isActive ?? false };
    this.buses.set(id, bus);
    return bus;
  }

  async updateBusLocation(update: UpdateBusLocation): Promise<Bus | undefined> {
    const bus = this.buses.get(update.id);
    if (!bus) return undefined;
    
    const updatedBus: Bus = {
      ...bus,
      latitude: update.latitude,
      longitude: update.longitude,
      isActive: update.isActive ?? bus.isActive,
      lastUpdate: new Date()
    };
    
    this.buses.set(update.id, updatedBus);
    return updatedBus;
  }

  async deleteBus(id: string): Promise<boolean> {
    return this.buses.delete(id);
  }

  // Route operations
  async getAllRoutes(): Promise<BusRoute[]> {
    return Array.from(this.routes.values());
  }

  async getRoute(id: string): Promise<BusRoute | undefined> {
    return this.routes.get(id);
  }

  async createRoute(insertRoute: InsertBusRoute): Promise<BusRoute> {
    const id = randomUUID();
    const route: BusRoute = { 
      ...insertRoute, 
      id,
      color: insertRoute.color || "#2563eb"
    };
    this.routes.set(id, route);
    return route;
  }

  async deleteRoute(id: string): Promise<boolean> {
    return this.routes.delete(id);
  }

  // Bus stop operations
  async getAllBusStops(): Promise<BusStop[]> {
    return Array.from(this.busStops.values());
  }

  async getBusStop(id: string): Promise<BusStop | undefined> {
    return this.busStops.get(id);
  }

  async getBusStopsByRoute(routeId: string): Promise<BusStop[]> {
    return Array.from(this.busStops.values()).filter(stop => stop.routeId === routeId);
  }

  async createBusStop(insertStop: InsertBusStop): Promise<BusStop> {
    const id = randomUUID();
    const stop: BusStop = { 
      ...insertStop, 
      id,
      routeId: insertStop.routeId || null
    };
    this.busStops.set(id, stop);
    return stop;
  }

  async deleteBusStop(id: string): Promise<boolean> {
    return this.busStops.delete(id);
  }
}

export const storage = new MemStorage();
