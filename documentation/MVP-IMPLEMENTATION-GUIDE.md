# MVP Implementation Guide: Bus Tracker App

This guide provides step-by-step instructions to achieve the MVP of the bus tracking application, integrating the existing `BusRoutePlanner-main` frontend with Supabase backend.

## Prerequisites

- Node.js and npm installed
- Supabase account (free tier works)
- Git repository initialized
- Basic knowledge of SQL, JavaScript, and React

---

## Phase 1: Database Schema Generation and Deployment

### Step 1.1: Analyze the ER Model

Based on `project-der.md`, identify all entities and relationships:

**Entities:**
- `Línea` (Line/BusRoute)
- `Parada` (BusStop)
- `Ruta_Parada` (RouteStop - associative entity)
- `Unidad` (Unit/Bus)
- `Posicion_Actual` (CurrentPosition)
- `Usuario` (User)
- `Favoritos` (Favorites)

### Step 1.2: Generate SQL Schema

Create a new file `supabase/schema.sql` in the root of your project with the following SQL schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: usuarios (Users)
CREATE TABLE usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('conductor', 'pasajero', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: lineas (Bus Routes/Lines)
CREATE TABLE lineas (
    id_linea UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    tarifa DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    color VARCHAR(7) DEFAULT '#2563eb',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: paradas (Bus Stops)
CREATE TABLE paradas (
    id_parada UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: ruta_parada (Route-Stop Association - Weak Entity)
CREATE TABLE ruta_parada (
    id_linea UUID NOT NULL REFERENCES lineas(id_linea) ON DELETE CASCADE,
    id_parada UUID NOT NULL REFERENCES paradas(id_parada) ON DELETE CASCADE,
    orden INTEGER NOT NULL,
    PRIMARY KEY (id_linea, id_parada, orden),
    CONSTRAINT unique_orden_per_linea UNIQUE (id_linea, orden)
);

-- Table: unidades (Bus Units)
CREATE TABLE unidades (
    id_unidad UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_linea UUID NOT NULL REFERENCES lineas(id_linea) ON DELETE RESTRICT,
    placa VARCHAR(20) NOT NULL UNIQUE,
    modelo VARCHAR(100),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: posicion_actual (Current Position)
CREATE TABLE posicion_actual (
    id_posicion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_unidad UUID NOT NULL REFERENCES unidades(id_unidad) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    velocidad DECIMAL(5, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'en_ruta',
    CONSTRAINT unique_unidad_posicion UNIQUE (id_unidad)
);

-- Table: unidad_conductor (Unit-Driver Relationship - 1:1)
CREATE TABLE unidad_conductor (
    id_unidad UUID PRIMARY KEY REFERENCES unidades(id_unidad) ON DELETE CASCADE,
    id_usuario UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_finalizacion TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table: favoritos (Favorites)
CREATE TABLE favoritos (
    id_favorito UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    tipo_favorito VARCHAR(50) NOT NULL CHECK (tipo_favorito IN ('parada', 'linea')),
    id_referencia UUID NOT NULL, -- Can reference parada or linea
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_favorite UNIQUE (id_usuario, tipo_favorito, id_referencia)
);

-- Table: posicion_historica (Historical Position - for analytics)
CREATE TABLE posicion_historica (
    id_historico UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_unidad UUID NOT NULL REFERENCES unidades(id_unidad) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    velocidad DECIMAL(5, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'en_ruta'
);

-- Indexes for performance
CREATE INDEX idx_ruta_parada_linea ON ruta_parada(id_linea);
CREATE INDEX idx_ruta_parada_parada ON ruta_parada(id_parada);
CREATE INDEX idx_unidades_linea ON unidades(id_linea);
CREATE INDEX idx_posicion_actual_unidad ON posicion_actual(id_unidad);
CREATE INDEX idx_posicion_historica_unidad_timestamp ON posicion_historica(id_unidad, timestamp DESC);
CREATE INDEX idx_favoritos_usuario ON favoritos(id_usuario);
CREATE INDEX idx_unidad_conductor_usuario ON unidad_conductor(id_usuario);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for usuarios updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to archive position to historical table
CREATE OR REPLACE FUNCTION archive_position()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO posicion_historica (id_unidad, timestamp, latitud, longitud, velocidad, status)
    VALUES (OLD.id_unidad, OLD.timestamp, OLD.latitud, OLD.longitud, OLD.velocidad, OLD.status);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to archive old positions
CREATE TRIGGER archive_old_position BEFORE UPDATE ON posicion_actual
    FOR EACH ROW EXECUTE FUNCTION archive_position();
```

### Step 1.3: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Navigate to **SQL Editor** in the Supabase dashboard
4. Copy and paste the entire SQL schema from `supabase/schema.sql`
5. Click **Run** to execute the schema
6. Verify tables were created by checking the **Table Editor** section

### Step 1.4: Configure Supabase Client

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon/public key**
3. Create a `.env` file in the root of your project:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

4. Install Supabase client library:

```bash
cd BusRoutePlanner-main
npm install @supabase/supabase-js
```

---

## Phase 2: Service Layer Implementation

### Step 2.1: Create Supabase Client Instance

Create `BusRoutePlanner-main/client/src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 2.2: Create Service Layer File

Create `BusRoutePlanner-main/client/src/lib/services.js` - a pure JavaScript file containing only functions that interact with Supabase:

```javascript
import { supabase } from './supabase';

// ============================================
// USER SERVICES
// ============================================

export const userService = {
  /**
   * Register a new user
   */
  async register(userData) {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        nombre: userData.nombre,
        email: userData.email,
        password: userData.password, // In production, hash this!
        rol: userData.rol || 'pasajero'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Login user (basic - in production use Supabase Auth)
   */
  async login(email, password) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_usuario', userId)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// LINEA (ROUTE) SERVICES
// ============================================

export const lineaService = {
  /**
   * Get all bus lines/routes
   */
  async getAll() {
    const { data, error } = await supabase
      .from('lineas')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get line by ID
   */
  async getById(lineaId) {
    const { data, error } = await supabase
      .from('lineas')
      .select('*')
      .eq('id_linea', lineaId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new line
   */
  async create(lineaData) {
    const { data, error } = await supabase
      .from('lineas')
      .insert([{
        nombre: lineaData.nombre,
        tarifa: lineaData.tarifa || 0,
        color: lineaData.color || '#2563eb'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get all stops for a line with order
   */
  async getStopsByLine(lineaId) {
    const { data, error } = await supabase
      .from('ruta_parada')
      .select(`
        orden,
        paradas:paradas (*)
      `)
      .eq('id_linea', lineaId)
      .order('orden', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// PARADA (STOP) SERVICES
// ============================================

export const paradaService = {
  /**
   * Get all bus stops
   */
  async getAll() {
    const { data, error } = await supabase
      .from('paradas')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get stop by ID
   */
  async getById(paradaId) {
    const { data, error } = await supabase
      .from('paradas')
      .select('*')
      .eq('id_parada', paradaId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new stop
   */
  async create(paradaData) {
    const { data, error } = await supabase
      .from('paradas')
      .insert([{
        nombre: paradaData.nombre,
        latitud: paradaData.latitud,
        longitud: paradaData.longitud,
        direccion: paradaData.direccion || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Add stop to a route with order
   */
  async addToRoute(lineaId, paradaId, orden) {
    const { data, error } = await supabase
      .from('ruta_parada')
      .insert([{
        id_linea: lineaId,
        id_parada: paradaId,
        orden: orden
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// UNIDAD (BUS) SERVICES
// ============================================

export const unidadService = {
  /**
   * Get all bus units
   */
  async getAll() {
    const { data, error } = await supabase
      .from('unidades')
      .select(`
        *,
        lineas:lineas (*),
        posicion_actual:posicion_actual (*)
      `);
    
    if (error) throw error;
    return data;
  },

  /**
   * Get active bus units
   */
  async getActive() {
    const { data, error } = await supabase
      .from('unidades')
      .select(`
        *,
        lineas:lineas (*),
        posicion_actual:posicion_actual (*)
      `)
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  },

  /**
   * Get units by line
   */
  async getByLine(lineaId) {
    const { data, error } = await supabase
      .from('unidades')
      .select(`
        *,
        lineas:lineas (*),
        posicion_actual:posicion_actual (*)
      `)
      .eq('id_linea', lineaId);
    
    if (error) throw error;
    return data;
  },

  /**
   * Get unit by ID
   */
  async getById(unidadId) {
    const { data, error } = await supabase
      .from('unidades')
      .select(`
        *,
        lineas:lineas (*),
        posicion_actual:posicion_actual (*),
        unidad_conductor:unidad_conductor (
          usuarios:usuarios (*)
        )
      `)
      .eq('id_unidad', unidadId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new unit
   */
  async create(unidadData) {
    const { data, error } = await supabase
      .from('unidades')
      .insert([{
        id_linea: unidadData.id_linea,
        placa: unidadData.placa,
        modelo: unidadData.modelo || null,
        is_active: unidadData.is_active || false
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Assign driver to unit
   */
  async assignDriver(unidadId, usuarioId) {
    // First, deactivate any existing active assignment for this driver
    await supabase
      .from('unidad_conductor')
      .update({ is_active: false, fecha_finalizacion: new Date().toISOString() })
      .eq('id_usuario', usuarioId)
      .eq('is_active', true);

    // Create new assignment
    const { data, error } = await supabase
      .from('unidad_conductor')
      .insert([{
        id_unidad: unidadId,
        id_usuario: usuarioId,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// POSICION (POSITION) SERVICES
// ============================================

export const posicionService = {
  /**
   * Update current position of a unit
   */
  async updatePosition(unidadId, positionData) {
    // Use upsert to update or insert
    const { data, error } = await supabase
      .from('posicion_actual')
      .upsert({
        id_unidad: unidadId,
        latitud: positionData.latitud,
        longitud: positionData.longitud,
        velocidad: positionData.velocidad || 0,
        status: positionData.status || 'en_ruta',
        timestamp: new Date().toISOString()
      }, {
        onConflict: 'id_unidad'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get current position of a unit
   */
  async getCurrentPosition(unidadId) {
    const { data, error } = await supabase
      .from('posicion_actual')
      .select('*')
      .eq('id_unidad', unidadId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  /**
   * Get all current positions for active units
   */
  async getAllCurrentPositions() {
    const { data, error } = await supabase
      .from('posicion_actual')
      .select(`
        *,
        unidades:unidades (
          *,
          lineas:lineas (*)
        )
      `);
    
    if (error) throw error;
    return data;
  },

  /**
   * Get historical positions for a unit
   */
  async getHistoricalPositions(unidadId, limit = 100) {
    const { data, error } = await supabase
      .from('posicion_historica')
      .select('*')
      .eq('id_unidad', unidadId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// FAVORITOS (FAVORITES) SERVICES
// ============================================

export const favoritosService = {
  /**
   * Get user favorites
   */
  async getUserFavorites(usuarioId) {
    const { data, error } = await supabase
      .from('favoritos')
      .select('*')
      .eq('id_usuario', usuarioId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Add favorite
   */
  async addFavorite(usuarioId, tipoFavorito, idReferencia) {
    const { data, error } = await supabase
      .from('favoritos')
      .insert([{
        id_usuario: usuarioId,
        tipo_favorito: tipoFavorito,
        id_referencia: idReferencia
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Remove favorite
   */
  async removeFavorite(favoritoId) {
    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('id_favorito', favoritoId);
    
    if (error) throw error;
    return true;
  }
};
```

---

## Phase 3: Frontend Integration

### Step 3.1: Update API Layer to Use Services

Replace the content of `BusRoutePlanner-main/client/src/lib/api.ts` to use the service layer:

```typescript
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
  driverName: unidad.unidad_conductor?.[0]?.usuarios?.nombre || 'Sin conductor',
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
```

**Note:** You'll need to add the `updateActiveStatus` method to `unidadService` in `services.js`:

```javascript
/**
 * Update unit active status
 */
async updateActiveStatus(unidadId, isActive) {
  const { data, error } = await supabase
    .from('unidades')
    .update({ is_active: isActive })
    .eq('id_unidad', unidadId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### Step 3.2: Update Environment Configuration

Ensure your `.env` file is in the `BusRoutePlanner-main` directory and Vite can access it. Update `vite.config.ts` if needed to load environment variables.

---

## Phase 4: Live Mode Simulation

### Step 4.1: Create Live Simulation Service

Create `BusRoutePlanner-main/client/src/lib/liveSimulation.js`:

```javascript
import { posicionService, unidadService } from './services';

/**
 * Simulates live bus movement by updating positions periodically
 * @param {Function} onUpdate - Callback function called on each update
 * @param {number} intervalMs - Update interval in milliseconds (default: 3000)
 * @returns {Function} - Function to stop the simulation
 */
export function startLiveSimulation(onUpdate, intervalMs = 3000) {
  let intervalId = null;
  let isRunning = false;

  const simulateMovement = async () => {
    try {
      // Get all active units
      const unidades = await unidadService.getActive();
      
      if (unidades.length === 0) {
        console.warn('No active units to simulate');
        return;
      }

      // Update each unit's position with slight random movement
      for (const unidad of unidades) {
        if (!unidad.posicion_actual) {
          // Initialize position if doesn't exist
          await posicionService.updatePosition(unidad.id_unidad, {
            latitud: 10.5 + Math.random() * 0.1, // Example coordinates
            longitud: -63.8 + Math.random() * 0.1,
            velocidad: 30 + Math.random() * 20,
            status: 'en_ruta'
          });
        } else {
          // Move position slightly (simulate movement)
          const currentLat = parseFloat(unidad.posicion_actual.latitud);
          const currentLng = parseFloat(unidad.posicion_actual.longitud);
          
          // Small random movement (approximately 50-100 meters)
          const latOffset = (Math.random() - 0.5) * 0.001;
          const lngOffset = (Math.random() - 0.5) * 0.001;
          
          await posicionService.updatePosition(unidad.id_unidad, {
            latitud: currentLat + latOffset,
            longitud: currentLng + lngOffset,
            velocidad: 30 + Math.random() * 20,
            status: 'en_ruta'
          });
        }
      }

      // Notify callback
      if (onUpdate) {
        const updatedUnits = await unidadService.getActive();
        onUpdate(updatedUnits);
      }
    } catch (error) {
      console.error('Error in live simulation:', error);
    }
  };

  const start = () => {
    if (isRunning) return;
    isRunning = true;
    
    // Run immediately
    simulateMovement();
    
    // Then run at intervals
    intervalId = setInterval(simulateMovement, intervalMs);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
  };

  // Auto-start
  start();

  // Return stop function
  return stop;
}

/**
 * Simulates driver view - tracks approach to stops
 * @param {string} unidadId - Unit ID
 * @param {Array} stops - Array of stops with {latitud, longitud, nombre}
 * @param {Function} onApproach - Callback when approaching a stop
 * @param {number} approachDistanceMeters - Distance threshold in meters (default: 100)
 * @param {number} intervalMs - Check interval in milliseconds (default: 2000)
 * @returns {Function} - Function to stop the tracking
 */
export function startStopApproachTracking(
  unidadId, 
  stops, 
  onApproach, 
  approachDistanceMeters = 100,
  intervalMs = 2000
) {
  let intervalId = null;
  let isRunning = false;
  let lastApproachedStop = null;

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const checkApproach = async () => {
    try {
      const currentPos = await posicionService.getCurrentPosition(unidadId);
      
      if (!currentPos) {
        console.warn('No current position for unit:', unidadId);
        return;
      }

      const currentLat = parseFloat(currentPos.latitud);
      const currentLng = parseFloat(currentPos.longitud);

      // Check distance to each stop
      for (const stop of stops) {
        const distance = calculateDistance(
          currentLat,
          currentLng,
          parseFloat(stop.latitud),
          parseFloat(stop.longitud)
        );

        // If within approach distance and not the last approached stop
        if (distance <= approachDistanceMeters && stop.id_parada !== lastApproachedStop) {
          lastApproachedStop = stop.id_parada;
          
          if (onApproach) {
            onApproach({
              stop,
              distance: Math.round(distance),
              unitId: unidadId
            });
          }
          
          break; // Only notify for closest stop
        }
      }
    } catch (error) {
      console.error('Error checking stop approach:', error);
    }
  };

  const start = () => {
    if (isRunning) return;
    isRunning = true;
    intervalId = setInterval(checkApproach, intervalMs);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
    lastApproachedStop = null;
  };

  // Auto-start
  start();

  return stop;
}
```

### Step 4.2: Integrate Live Simulation in Driver View

Update `BusRoutePlanner-main/client/src/pages/DriverView.tsx` to use the live simulation:

```typescript
import { useEffect, useState, useRef } from 'react';
import { startLiveSimulation, startStopApproachTracking } from '@/lib/liveSimulation';
import { unidadService, lineaService } from '@/lib/services';
// ... other imports

export default function DriverView() {
  const [isSimulating, setIsSimulating] = useState(false);
  const stopSimulationRef = useRef<(() => void) | null>(null);
  const stopApproachTrackingRef = useRef<(() => void) | null>(null);

  // Start/stop live simulation
  const toggleSimulation = () => {
    if (isSimulating) {
      // Stop simulation
      if (stopSimulationRef.current) {
        stopSimulationRef.current();
        stopSimulationRef.current = null;
      }
      if (stopApproachTrackingRef.current) {
        stopApproachTrackingRef.current();
        stopApproachTrackingRef.current = null;
      }
      setIsSimulating(false);
    } else {
      // Start simulation
      const stopSim = startLiveSimulation(
        async (updatedUnits) => {
          // Refresh UI with updated positions
          console.log('Units updated:', updatedUnits);
          // Trigger React Query refetch or update state
        },
        3000 // Update every 3 seconds
      );
      stopSimulationRef.current = stopSim;

      // Also start stop approach tracking if you have route stops
      // This is optional - implement based on your needs
      
      setIsSimulating(true);
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (stopSimulationRef.current) {
        stopSimulationRef.current();
      }
      if (stopApproachTrackingRef.current) {
        stopApproachTrackingRef.current();
      }
    };
  }, []);

  // ... rest of component
}
```

### Step 4.3: Integrate Live Updates in Passenger View

Update `BusRoutePlanner-main/client/src/pages/PassengerView.tsx` to poll for updates:

```typescript
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { busApi } from '@/lib/api';

export default function PassengerView() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Query for active buses with auto-refetch
  const { data: buses, refetch } = useQuery({
    queryKey: ['buses', 'active'],
    queryFn: () => busApi.getActive(),
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  // ... rest of component
}
```

---

## Phase 5: Testing and Data Seeding

### Step 5.1: Create Seed Data Script

Create `BusRoutePlanner-main/scripts/seedData.js`:

```javascript
import { lineaService, paradaService, unidadService, posicionService } from '../client/src/lib/services.js';

async function seedData() {
  try {
    console.log('Seeding database...');

    // Create sample lines
    const linea1 = await lineaService.create({
      nombre: 'Línea 1 - Centro - Playa',
      tarifa: 2.50,
      color: '#2563eb'
    });
    console.log('Created line:', linea1.nombre);

    // Create sample stops
    const stop1 = await paradaService.create({
      nombre: 'Parada Centro',
      latitud: 10.5000,
      longitud: -63.8000,
      direccion: 'Av. Principal, Centro'
    });

    const stop2 = await paradaService.create({
      nombre: 'Parada Playa',
      latitud: 10.5100,
      longitud: -63.8100,
      direccion: 'Av. Costera, Playa'
    });

    // Add stops to route
    await paradaService.addToRoute(linea1.id_linea, stop1.id_parada, 1);
    await paradaService.addToRoute(linea1.id_linea, stop2.id_parada, 2);

    // Create sample unit
    const unidad1 = await unidadService.create({
      id_linea: linea1.id_linea,
      placa: 'ABC-123',
      modelo: 'Mercedes Benz',
      is_active: true
    });

    // Set initial position
    await posicionService.updatePosition(unidad1.id_unidad, {
      latitud: 10.5050,
      longitud: -63.8050,
      velocidad: 0,
      status: 'en_ruta'
    });

    console.log('Seed data created successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedData();
```

### Step 5.2: Run Seed Script

```bash
cd BusRoutePlanner-main
node scripts/seedData.js
```

---

## Phase 6: Final Steps and Verification

### Step 6.1: Enable Row Level Security (RLS) in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. For each table, create policies as needed:
   - `usuarios`: Users can read their own data
   - `lineas`, `paradas`: Public read access
   - `unidades`, `posicion_actual`: Public read, authenticated write
   - `favoritos`: Users can only manage their own favorites

**Example RLS Policy (run in SQL Editor):**

```sql
-- Enable RLS on all tables
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE paradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE posicion_actual ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

-- Public read access for lines and stops
CREATE POLICY "Public read access for lineas" ON lineas
  FOR SELECT USING (true);

CREATE POLICY "Public read access for paradas" ON paradas
  FOR SELECT USING (true);

-- Public read, authenticated write for positions
CREATE POLICY "Public read access for posicion_actual" ON posicion_actual
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write access for posicion_actual" ON posicion_actual
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated update access for posicion_actual" ON posicion_actual
  FOR UPDATE USING (true);
```

### Step 6.2: Test the Application

1. Start the development server:
   ```bash
   cd BusRoutePlanner-main
   npm run dev
   ```

2. Verify:
   - Frontend loads without errors
   - Can view bus routes and stops
   - Live simulation updates positions
   - Driver view shows position updates
   - Passenger view shows moving buses on map

### Step 6.3: Production Considerations

Before deploying to production:

1. **Security:**
   - Implement proper password hashing (use Supabase Auth instead of custom auth)
   - Set up proper RLS policies
   - Use environment variables for all secrets

2. **Performance:**
   - Add database indexes (already included in schema)
   - Implement pagination for large datasets
   - Use Supabase Realtime subscriptions instead of polling

3. **Real-time Updates:**
   - Replace polling with Supabase Realtime:
     ```javascript
     import { supabase } from './supabase';
     
     // Subscribe to position updates
     const subscription = supabase
       .channel('position_updates')
       .on('postgres_changes', 
         { event: '*', schema: 'public', table: 'posicion_actual' },
         (payload) => {
           console.log('Position updated:', payload);
           // Update UI
         }
       )
       .subscribe();
     ```

---

## Summary Checklist

- [ ] SQL schema created and deployed to Supabase
- [ ] Supabase client configured with environment variables
- [ ] Service layer (`services.js`) created with all CRUD functions
- [ ] Frontend API layer updated to use service functions
- [ ] Live simulation service implemented
- [ ] Driver view integrated with live simulation
- [ ] Passenger view polling for updates
- [ ] Seed data script created and executed
- [ ] RLS policies configured
- [ ] Application tested end-to-end
- [ ] Ready for production deployment

---

## Next Steps (Post-MVP)

1. Implement Supabase Authentication (replace custom auth)
2. Add real-time subscriptions (replace polling)
3. Implement ETA calculation based on actual distance
4. Add push notifications for bus arrivals
5. Implement route optimization algorithms
6. Add analytics dashboard
7. Mobile app development (React Native)

---

## Troubleshooting

**Issue: Environment variables not loading**
- Ensure `.env` file is in `BusRoutePlanner-main` directory
- Restart dev server after adding env variables
- Check Vite documentation for env variable naming

**Issue: Supabase connection errors**
- Verify project URL and anon key are correct
- Check Supabase project is active
- Verify network connectivity

**Issue: RLS blocking queries**
- Check RLS policies in Supabase dashboard
- Temporarily disable RLS for testing (not recommended for production)
- Ensure proper authentication tokens are being sent

**Issue: Live simulation not updating**
- Check browser console for errors
- Verify units are marked as `is_active = true`
- Ensure service functions are working correctly
- Check Supabase logs for query errors

---

**End of Guide**

