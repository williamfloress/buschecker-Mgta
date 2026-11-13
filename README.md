# BusChecker Margarita

Seguimiento de autobuses en tiempo real para Isla de Margarita. Caso técnico de portafolio con flota simulada.

**Arquitectura:** SPA (React + TypeScript + Vite) que habla directo con **Supabase** (Postgres, Auth, RLS). No hay servidor propio.

## Características

- Mapa público (Leaflet + OpenStreetMap) con buses y paradas, sin iniciar sesión.
- Roles con Supabase Auth:
  - **Pasajero:** paradas y líneas favoritas.
  - **Conductor:** actualiza ubicación y estado de su unidad.
  - **Admin:** gestiona paradas.
- Tema claro/oscuro.

## Requisitos

- Node.js 20+
- Un proyecto de Supabase con las migraciones de `supabase/migrations/` aplicadas y `supabase/seed.sql` cargado.

## Configuración

Crea un `.env` en la raíz:

```bash
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Nunca uses la `service_role` key en el frontend.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite en http://localhost:5000 |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run typecheck` | Comprobación de tipos con `tsc` |

## Estructura

```
src/
├── components/   # Componentes de la app (ui/ = primitivas shadcn/Radix)
├── contexts/     # AuthContext (Supabase Auth)
├── lib/
│   ├── supabase.js   # Cliente de Supabase
│   ├── services.js   # Acceso a tablas de Supabase
│   ├── api.ts        # Mapeo de tablas a tipos de dominio
│   └── types.ts      # Tipos de dominio (Bus, BusStop, BusRoute)
└── pages/        # Landing, Pasajero, Conductor, Admin
supabase/
├── migrations/   # Esquema, auth, RLS, archivo de posiciones
└── seed.sql      # Líneas, paradas y unidades de Margarita
```

## Despliegue

Vercel (`vercel.json`): build con `npm run build`, salida `dist/`, rewrite SPA a `index.html`. Configura las dos variables `VITE_SUPABASE_*` en el proyecto de Vercel.

## Licencia

MIT
