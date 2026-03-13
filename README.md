# BusTracker - Aplicación de Seguimiento de Autobuses en Tiempo Real

Una aplicación de seguimiento de autobuses en tiempo real para Isla de Margarita, construida con React, TypeScript, Express y Vite.

## Características

- **Acceso Público**: Seguimiento de ubicación de autobuses en tiempo real y vista de mapa (no requiere inicio de sesión)
- Mapa interactivo con integración de OpenStreetMap
- **Funciones Autenticadas**: Múltiples roles de usuario con diferentes permisos
  - **Pasajero**: Agregar paradas favoritas a tu cuenta
  - **Conductor**: Actualizar ubicación y estado del autobús en tiempo real
  - **Administrador**: Gestionar paradas de autobús (crear, actualizar, eliminar)
- Sistema de favoritos para pasajeros (requiere inicio de sesión)
- Soporte para tema oscuro/claro

## Requisitos Previos

- Node.js (v18 o superior)
- npm (incluido con Node.js)
- cross-env (ya instalado como dependencia de desarrollo)

## Comenzando

### 1. Instalar Dependencias

Si aún no has instalado las dependencias:

```bash
npm install
```

### 2. Ejecutar el Servidor de Desarrollo

Inicia el servidor de desarrollo (ejecuta tanto el frontend como el backend):

```bash
npm run dev
```

La aplicación se iniciará en el **puerto 5000** por defecto.

### 3. Acceder a la Aplicación

Abre tu navegador y navega a:

```
http://localhost:5000
```

## Scripts Disponibles

- **`npm run dev`** - Iniciar servidor de desarrollo (se ejecuta en el puerto 5000)
- **`npm run build`** - Construir la aplicación para producción
- **`npm run start`** - Iniciar servidor de producción (requiere construcción previa)
- **`npm run check`** - Verificar tipos de archivos TypeScript
- **`npm run db:push`** - Enviar cambios de esquema de base de datos (cuando se usa Supabase)

## Estructura del Proyecto

```
buschecker-mgta/
├── server/          # Servidor backend Express
│   ├── index.ts     # Punto de entrada del servidor
│   ├── routes.ts    # Rutas de API
│   ├── storage.ts   # Almacenamiento en memoria (con datos de ejemplo)
│   └── vite.ts      # Integración de Vite para frontend
├── src/             # Aplicación frontend React
│   ├── components/  # Componentes React
│   ├── pages/       # Componentes de página (DriverView, PassengerView)
│   └── lib/         # Utilidades y cliente API
├── shared/          # Esquemas TypeScript compartidos
└── documentacion/   # Documentación del proyecto

```

## Configuración Actual

- **Almacenamiento**: Actualmente usando almacenamiento en memoria con datos de ejemplo (rutas de autobús de Isla de Margarita)
- **Puerto**: Por defecto 5000 (puede cambiarse mediante la variable de entorno `PORT`)
- **Base de Datos**: Se migrará a Supabase en la Fase 1 de la implementación del MVP

## Datos de Ejemplo

La aplicación viene precargada con datos de ejemplo:
- 5 rutas de autobús (RA-1 a RA-5)
- Múltiples paradas de autobús para cada ruta
- 6 autobuses con conductores asignados
- Ubicaciones basadas en Isla de Margarita, Venezuela

## Modo de Desarrollo

En modo de desarrollo, el servidor:
- Sirve el frontend de React a través de Vite con recarga de módulos en caliente (HMR)
- Proporciona endpoints REST API en `/api/*`
- Usa almacenamiento en memoria (los datos se reinician al reiniciar el servidor)

## Solución de Problemas

### Puerto Ya en Uso

Si el puerto 5000 ya está en uso, configura un puerto diferente:

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

### Problemas con Dependencias

Si encuentras problemas con las dependencias:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Funciones Públicas vs Autenticadas

### Acceso Público (No Requiere Inicio de Sesión)
- Ver ubicaciones de autobuses en tiempo real en el mapa
- Ver todas las paradas de autobús y rutas
- Rastrear paradas de autobús cercanas
- Ver información de llegada de autobuses

### Funciones Autenticadas (Requiere Inicio de Sesión)

La aplicación admite tres roles de usuario con diferentes permisos:

- **Administrador (`admin`)**: 
  - Puede crear, actualizar y eliminar paradas de autobús
  - Tiene acceso a la interfaz de administración para gestionar la base de datos de paradas de autobús
  
- **Conductor (`conductor`)**: 
  - Puede actualizar la ubicación y estado de su autobús
  - Tiene acceso a la vista del conductor para actualizaciones de posición en tiempo real
  
- **Pasajero (`pasajero`)**: 
  - Puede agregar paradas favoritas a su cuenta
  - Puede guardar paradas frecuentemente usadas para acceso rápido

## Autenticación

La aplicación incluye un sistema de inicio de sesión para acceder a funciones autenticadas. Los usuarios pueden hacer clic en el botón "Iniciar Sesión" en el encabezado para iniciar sesión con su correo electrónico y contraseña. El rol del usuario determina qué interfaz y permisos tiene acceso.

**Nota**: Para usar funciones autenticadas, necesitas tener usuarios creados en la base de datos de Supabase con los roles apropiados.

## Próximos Pasos

Consulta el [Estado Actual y Próximos Pasos](./documentacion/01-estado-actual-y-proximos-pasos.md) para ver qué falta por hacer.

Sigue la [Lista de Verificación de Implementación MVP](./documentacion/06-mvp-implementation-checklist.md) o la [versión en español](./documentacion/05-checklist-mvp-implementacion.md) para:
1. Configurar la base de datos de Supabase
2. Migrar de almacenamiento en memoria a almacenamiento en base de datos
3. Implementar autenticación (Completado)
4. Agregar funciones en tiempo real

## Licencia

MIT
