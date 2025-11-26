import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertBusSchema, 
  updateBusLocationSchema, 
  insertBusRouteSchema, 
  insertBusStopSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Bus operations
  app.get('/api/buses', async (req, res) => {
    try {
      const buses = await storage.getAllBuses();
      res.json(buses);
    } catch (error) {
      console.error('Error fetching buses:', error);
      res.status(500).json({ error: 'Failed to fetch buses' });
    }
  });

  app.get('/api/buses/active', async (req, res) => {
    try {
      const buses = await storage.getActiveBuses();
      res.json(buses);
    } catch (error) {
      console.error('Error fetching active buses:', error);
      res.status(500).json({ error: 'Failed to fetch active buses' });
    }
  });

  app.get('/api/buses/route/:routeId', async (req, res) => {
    try {
      const { routeId } = req.params;
      const buses = await storage.getBusesByRoute(routeId);
      res.json(buses);
    } catch (error) {
      console.error('Error fetching buses by route:', error);
      res.status(500).json({ error: 'Failed to fetch buses for route' });
    }
  });

  app.post('/api/buses', async (req, res) => {
    try {
      const validatedData = insertBusSchema.parse(req.body);
      const bus = await storage.createBus(validatedData);
      res.status(201).json(bus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        console.error('Error creating bus:', error);
        res.status(500).json({ error: 'Failed to create bus' });
      }
    }
  });

  app.patch('/api/buses/:id/location', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = updateBusLocationSchema.parse({ ...req.body, id });
      const updatedBus = await storage.updateBusLocation(updateData);
      
      if (!updatedBus) {
        return res.status(404).json({ error: 'Bus not found' });
      }
      
      res.json(updatedBus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        console.error('Error updating bus location:', error);
        res.status(500).json({ error: 'Failed to update bus location' });
      }
    }
  });

  // Route operations
  app.get('/api/routes', async (req, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
      res.status(500).json({ error: 'Failed to fetch routes' });
    }
  });

  app.post('/api/routes', async (req, res) => {
    try {
      const validatedData = insertBusRouteSchema.parse(req.body);
      const route = await storage.createRoute(validatedData);
      res.status(201).json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        console.error('Error creating route:', error);
        res.status(500).json({ error: 'Failed to create route' });
      }
    }
  });

  // Bus stop operations
  app.get('/api/bus-stops', async (req, res) => {
    try {
      const stops = await storage.getAllBusStops();
      res.json(stops);
    } catch (error) {
      console.error('Error fetching bus stops:', error);
      res.status(500).json({ error: 'Failed to fetch bus stops' });
    }
  });

  app.get('/api/bus-stops/route/:routeId', async (req, res) => {
    try {
      const { routeId } = req.params;
      const stops = await storage.getBusStopsByRoute(routeId);
      res.json(stops);
    } catch (error) {
      console.error('Error fetching bus stops by route:', error);
      res.status(500).json({ error: 'Failed to fetch bus stops for route' });
    }
  });

  app.post('/api/bus-stops', async (req, res) => {
    try {
      const validatedData = insertBusStopSchema.parse(req.body);
      const stop = await storage.createBusStop(validatedData);
      res.status(201).json(stop);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        console.error('Error creating bus stop:', error);
        res.status(500).json({ error: 'Failed to create bus stop' });
      }
    }
  });

  // Calculate arrival times for a bus stop
  app.get('/api/arrivals/:stopId', async (req, res) => {
    try {
      const { stopId } = req.params;
      const stop = await storage.getBusStop(stopId);
      
      if (!stop) {
        return res.status(404).json({ error: 'Bus stop not found' });
      }
      
      const routeBuses = stop.routeId ? await storage.getBusesByRoute(stop.routeId) : [];
      const activeBuses = routeBuses.filter(bus => bus.isActive);
      const route = stop.routeId ? await storage.getRoute(stop.routeId) : null;
      
      // Calculate estimated arrival times (simplified calculation)
      const arrivals = activeBuses.map(bus => {
        const distance = calculateDistance(
          bus.latitude, bus.longitude,
          stop.latitude, stop.longitude
        );
        
        // Assume average bus speed of 25 km/h in city traffic
        const estimatedMinutes = Math.round((distance / 25) * 60);
        
        return {
          busId: bus.id,
          routeNumber: route?.routeNumber || 'Unknown',
          destination: route?.routeName || 'Unknown',
          estimatedMinutes: Math.max(1, estimatedMinutes), // At least 1 minute
          isDelayed: estimatedMinutes > 15, // Consider delayed if > 15 minutes
          driverName: bus.driverName
        };
      });
      
      res.json({
        stopName: stop.name,
        arrivals: arrivals.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)
      });
    } catch (error) {
      console.error('Error calculating arrivals:', error);
      res.status(500).json({ error: 'Failed to calculate arrivals' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}
