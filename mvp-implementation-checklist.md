# MVP Implementation Checklist

This checklist is based on the [MVP Implementation Guide](./documentation/mvp-implementation-guide.md). Use this to track your progress step-by-step.

## Prerequisites

- [x] Node.js and npm installed
- [x] Supabase account created (free tier works)
- [x] Git repository initialized
- [x] Basic knowledge of SQL, JavaScript, and React

---

## Phase 1: Database Schema Generation and Deployment

### Step 1.1: Analyze the ER Model
- [x] Review `documentation/project-der.md` to understand entities and relationships
- [x] Identify all entities:
  - [x] `Línea` (Line/BusRoute)
  - [x] `Parada` (BusStop)
  - [x] `Ruta_Parada` (RouteStop - associative entity)
  - [x] `Unidad` (Unit/Bus)
  - [x] `Posicion_Actual` (CurrentPosition)
  - [x] `Usuario` (User)
  - [x] `Favoritos` (Favorites)

### Step 1.2: Generate SQL Schema
- [x] Create folder `supabase/` in project root
- [x] Create file `supabase/schema.sql`
- [x] Copy SQL schema from MVP Implementation Guide (Phase 1, Step 1.2)
- [x] Verify all tables, indexes, functions, and triggers are included

### Step 1.3: Set Up Supabase Project
- [x] Go to [supabase.com](https://supabase.com) and create a new project
- [x] Wait for the project to be fully provisioned
- [x] Navigate to **SQL Editor** in the Supabase dashboard
- [x] Copy and paste the entire SQL schema from `supabase/schema.sql`
- [x] Click **Run** to execute the schema
- [x] Verify tables were created by checking the **Table Editor** section

### Step 1.4: Configure Supabase Client
- [x] In Supabase dashboard, go to **Settings** → **API**
- [x] Copy your **Project URL** and **anon/public key**
- [x] Create a `.env` file in the root of your project
- [x] Add environment variables:
  ```env
  VITE_SUPABASE_URL=your_project_url_here
  VITE_SUPABASE_ANON_KEY=your_anon_key_here
  ```
- [x] Install Supabase client library: `npm install @supabase/supabase-js`

---

## Phase 2: Service Layer Implementation

### Step 2.1: Create Supabase Client Instance
- [x] Create file `src/lib/supabase.js`
- [x] Copy code from MVP Implementation Guide (Phase 2, Step 2.1)
- [x] Verify environment variables are loaded correctly

### Step 2.2: Create Service Layer File
- [x] Create file `src/lib/services.js`
- [x] Copy all service implementations from MVP Implementation Guide (Phase 2, Step 2.2):
  - [x] `userService` (register, login, getUserById)
  - [x] `lineaService` (getAll, getById, create, getStopsByLine)
  - [x] `paradaService` (getAll, getById, create, addToRoute)
  - [x] `unidadService` (getAll, getActive, getByLine, getById, create, assignDriver)
  - [x] `posicionService` (updatePosition, getCurrentPosition, getAllCurrentPositions, getHistoricalPositions)
  - [x] `favoritosService` (getUserFavorites, addFavorite, removeFavorite)
- [x] Add `updateActiveStatus` method to `unidadService` (from Phase 3, Step 3.1 note)

---

## Phase 3: Frontend Integration

### Step 3.1: Update API Layer to Use Services
- [x] Update `src/lib/api.ts` to use service layer
- [x] Copy mapping functions from MVP Implementation Guide (Phase 3, Step 3.1):
  - [x] `mapUnidadToBus`
  - [x] `mapLineaToBusRoute`
  - [x] `mapParadaToBusStop`
- [x] Update API functions:
  - [x] `busApi` (getAll, getActive, getByRoute, create, updateLocation)
  - [x] `routeApi` (getAll, create)
  - [x] `busStopApi` (getAll, getByRoute, create)
  - [x] `arrivalApi` (getForStop)

### Step 3.2: Update Environment Configuration
- [ ] Ensure `.env` file is in project root
- [ ] Verify Vite can access environment variables
- [ ] Update `vite.config.ts` if needed to load environment variables

---

## Phase 4: Live Mode Simulation

### Step 4.1: Create Live Simulation Service
- [ ] Create file `src/lib/liveSimulation.js`
- [ ] Copy `startLiveSimulation` function from MVP Implementation Guide (Phase 4, Step 4.1)
- [ ] Copy `startStopApproachTracking` function
- [ ] Verify all imports are correct

### Step 4.2: Integrate Live Simulation in Driver View
- [ ] Update `src/pages/DriverView.tsx`
- [ ] Add imports for `startLiveSimulation` and `startStopApproachTracking`
- [ ] Add state management for simulation (`isSimulating`, refs)
- [ ] Implement `toggleSimulation` function
- [ ] Add cleanup in `useEffect` hook

### Step 4.3: Integrate Live Updates in Passenger View
- [ ] Update `src/pages/PassengerView.tsx`
- [ ] Add `useQuery` hook with `refetchInterval: 3000`
- [ ] Verify buses update automatically every 3 seconds

---

## Phase 5: Testing and Data Seeding

### Step 5.1: Create Seed Data Script
- [ ] Create folder `scripts/` in project root
- [ ] Create file `scripts/seedData.js`
- [ ] Copy seed data script from MVP Implementation Guide (Phase 5, Step 5.1)
- [ ] Update import path if needed (should be `../src/lib/services.js`)

### Step 5.2: Run Seed Script
- [ ] Run seed script: `node scripts/seedData.js`
- [ ] Verify data was created in Supabase dashboard
- [ ] Check that sample line, stops, and unit were created
- [ ] Verify initial position was set

---

## Phase 6: Final Steps and Verification

### Step 6.1: Enable Row Level Security (RLS) in Supabase
- [ ] Go to Supabase Dashboard → **Authentication** → **Policies**
- [ ] Run RLS enable commands for all tables (from MVP Implementation Guide, Phase 6, Step 6.1)
- [ ] Create public read policies for `lineas` and `paradas`
- [ ] Create public read and authenticated write policies for `posicion_actual`
- [ ] Create user-specific policies for `usuarios` and `favoritos`
- [ ] Test policies work correctly

### Step 6.2: Test the Application
- [ ] Start development server: `npm run dev`
- [ ] Verify frontend loads without errors
- [ ] Test viewing bus routes and stops
- [ ] Test live simulation updates positions
- [ ] Verify driver view shows position updates
- [ ] Verify passenger view shows moving buses on map

### Step 6.3: Production Considerations
- [ ] Review security checklist:
  - [ ] Implement proper password hashing (use Supabase Auth)
  - [ ] Set up proper RLS policies
  - [ ] Use environment variables for all secrets
- [ ] Review performance optimizations:
  - [ ] Database indexes are in place
  - [ ] Pagination implemented for large datasets
  - [ ] Consider Supabase Realtime subscriptions
- [ ] Plan for real-time updates:
  - [ ] Replace polling with Supabase Realtime subscriptions
  - [ ] Test subscription implementation

---

## Summary Checklist

- [x] SQL schema created and deployed to Supabase
- [x] Supabase client configured with environment variables
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

## Notes

- All file paths have been updated to reflect the new root structure (no `BusRoutePlanner-main/client/` prefix)
- Refer to `documentation/mvp-implementation-guide.md` for detailed code examples and explanations
- Check the troubleshooting section in the MVP Implementation Guide if you encounter issues

