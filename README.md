# BusTracker - Real-time Bus Tracking Application

A real-time bus tracking application for Isla de Margarita, built with React, TypeScript, Express, and Vite.

## Features

- 🚌 Real-time bus location tracking
- 🗺️ Interactive map with OpenStreetMap integration
- 👥 Passenger and Driver views
- 📍 Bus stops and routes management
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

## Next Steps

Follow the [MVP Implementation Checklist](./mvp-implementation-checklist.md) to:
1. Set up Supabase database
2. Migrate from in-memory to database storage
3. Implement authentication
4. Add real-time features

## License

MIT

