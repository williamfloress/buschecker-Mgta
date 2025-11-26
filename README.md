# BusTracker - Real-time Bus Tracking Application

A real-time bus tracking application for Isla de Margarita, built with React, TypeScript, Express, and Vite.

## Features

- 🚌 **Public Access**: Real-time bus location tracking and map view (no login required)
- 🗺️ Interactive map with OpenStreetMap integration
- 👥 **Authenticated Features**: Multiple user roles with different permissions
  - **Passenger**: Add favorite stops to your account
  - **Driver**: Update bus location and status in real-time
  - **Admin**: Manage bus stops (create, update, delete)
- ⭐ Passenger favorites system (requires login)
- 🌓 Dark/Light theme support

## Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)
- cross-env (already installed as dev dependency)

## Getting Started

### 1. Install Dependencies

If you haven't already installed dependencies:

```bash
npm install
```

### 2. Run the Development Server

Start the development server (runs both frontend and backend):

```bash
npm run dev
```

The application will start on **port 5000** by default.

### 3. Access the Application

Open your browser and navigate to:

```
http://localhost:5000
```

## Available Scripts

- **`npm run dev`** - Start development server (runs on port 5000)
- **`npm run build`** - Build the application for production
- **`npm run start`** - Start production server (requires build first)
- **`npm run check`** - Type-check TypeScript files
- **`npm run db:push`** - Push database schema changes (when using Supabase)

## Project Structure

```
buschecker-mgta/
├── server/          # Express backend server
│   ├── index.ts     # Server entry point
│   ├── routes.ts    # API routes
│   ├── storage.ts   # In-memory storage (with sample data)
│   └── vite.ts      # Vite integration for frontend
├── src/             # React frontend application
│   ├── components/  # React components
│   ├── pages/       # Page components (DriverView, PassengerView)
│   └── lib/         # Utilities and API client
├── shared/          # Shared TypeScript schemas
└── documentation/   # Project documentation

```

## Current Setup

- **Storage**: Currently using in-memory storage with sample data (Isla de Margarita bus routes)
- **Port**: Defaults to 5000 (can be changed via `PORT` environment variable)
- **Database**: Will be migrated to Supabase in Phase 1 of MVP implementation

## Sample Data

The application comes pre-loaded with sample data:
- 5 bus routes (RA-1 through RA-5)
- Multiple bus stops for each route
- 6 buses with assigned drivers
- Locations based on Isla de Margarita, Venezuela

## Development Mode

In development mode, the server:
- Serves the React frontend via Vite with hot module replacement (HMR)
- Provides REST API endpoints at `/api/*`
- Uses in-memory storage (data resets on server restart)

## Troubleshooting

### Port Already in Use

If port 5000 is already in use, set a different port:

**Windows PowerShell:**
```powershell
$env:PORT=3000; npm run dev
```

**Windows CMD:**
```cmd
set PORT=3000 && npm run dev
```

**Mac/Linux:**
```bash
PORT=3000 npm run dev
```

### Dependencies Issues

If you encounter dependency issues:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Public vs Authenticated Features

### Public Access (No Login Required)
- ✅ View real-time bus locations on the map
- ✅ See all bus stops and routes
- ✅ Track nearby bus stops
- ✅ View bus arrival information

### Authenticated Features (Login Required)

The application supports three user roles with different permissions:

- **Admin (`admin`)**: 
  - Can create, update, and delete bus stops
  - Has access to the admin interface for managing the bus stop database
  
- **Driver (`conductor`)**: 
  - Can update their bus location and status
  - Has access to the driver view for real-time position updates
  
- **Passenger (`pasajero`)**: 
  - Can add favorite stops to their account
  - Can save frequently used stops for quick access

## Authentication

The application includes a login system for accessing authenticated features. Users can click the "Iniciar Sesión" button in the header to log in with their email and password. The user's role determines which interface and permissions they have access to.

**Note**: To use authenticated features, you need to have users created in the Supabase database with the appropriate roles.

## Next Steps

Follow the [MVP Implementation Checklist](./mvp-implementation-checklist.md) to:
1. Set up Supabase database
2. Migrate from in-memory to database storage
3. Implement authentication (✅ Completed)
4. Add real-time features

## License

MIT

