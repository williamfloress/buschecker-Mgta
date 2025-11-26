## Flujo de Proyecto: App de Seguimiento de Buses

### 1. Fundamentos y Planificación
- **Definir actores y personas**: conductor, pasajero, operador/administrador.
- **Documentar viajes de usuario**: abordaje, seguimiento, inicio/fin de turno, asignación de ruta.
- **Delimitar el alcance del MVP**: compartir ubicación en tiempo real, mostrar rutas, calcular ETAs, buses alternativos.
- **Recolectar datos de transporte**: obtener rutas, paradas, horarios existentes; preparar importaciones CSV/GeoJSON.
- **Elegir hosting y despliegue**: seleccionar nube (AWS/GCP/Azure), pipeline CI/CD (GitHub Actions).

### 2. Arquitectura y Decisiones de Stack
- **Frontend**: React Native (Expo o bare), TypeScript, gestión de estado (Zustand/Redux Toolkit), navegación (React Navigation), geolocalización (react-native-geolocation-service), mapas (Mapbox SDK o Google Maps).
- **Backend**: Node.js (NestJS/Express + TypeScript), WebSockets (Socket.IO o ws puro), REST para CRUD, workers en segundo plano (BullMQ) para ETAs y notificaciones.
- **Capa de datos**: PostgreSQL (TypeORM/Prisma), Redis para caché de vehículos en vivo y pub/sub, almacenamiento de objetos para activos, extensión opcional TimescaleDB para historiales.
- **Observabilidad**: logging (Winston + CloudWatch/Stackdriver), métricas (Prometheus), seguimiento de errores (Sentry).
- **Seguridad**: autenticación OAuth2/JWT, control de acceso basado en roles, HTTPS obligatorio.

### 3. Modelado de Datos y Esquema
- **Entidades**: usuarios, roles, conductores, vehículos, rutas, segmentos de ruta, paradas, asignaciones de conductor, actualizaciones de ubicación, viajes, alertas.
- **Relaciones**: conductor ↔ vehículo (uno a uno), ruta ↔ paradas (muchos a muchos ordenados), viaje ↔ actualizaciones de ubicación (serie temporal).
- **Migraciones**: configurar flujo de migraciones (Prisma migrate o TypeORM CLI).
- **Scripts de seed**: cargar rutas/paradas de ejemplo para Isla de Margarita.

### 4. Hoja de Ruta de Implementación Backend
1. **Bootstrap de la API**: iniciar proyecto Node.js, configurar TypeScript, linting, testing (Jest).
2. **Configuración de la base de datos**: conectar a PostgreSQL, implementar modelos Prisma/TypeORM, migraciones, seeds.
3. **Módulo de autenticación**: registro de usuarios, login por rol, gestión de sesiones, tokens de refresco.
4. **CRUD de rutas y paradas**: endpoints seguros para que operadores gestionen datos de tránsito.
5. **Flujo de asignación de conductores**: endpoints para asignar vehículos a conductores e iniciar viajes.
6. **Gateway WebSocket**:
   - Canal de conductor: autenticar, recibir payloads GPS con throttling, validar y persistir último punto, publicar en Redis.
   - Canal de pasajero: suscribirse por ruta/parada, transmitir posiciones actuales de vehículos y metadatos.
7. **Servicio de ETA**: worker que consume actualizaciones de ubicación, estima llegadas vía distancia + promedios históricos.
8. **Notificaciones**: eventos push (bus acercándose a parada, alertas de servicio) vía integración FCM/APNs.
9. **API para panel administrativo** (opcional): proveer analíticas, reproducción histórica, métricas de cumplimiento.

### 5. Hoja de Ruta de Implementación Frontend (React Native)
1. **Configuración del proyecto**: crear app Expo/bare RN, configurar TypeScript, eslint, prettier.
2. **Estado y red**: configurar cliente API (axios + interceptores), cliente WebSocket, store global (Zustand/Redux).
3. **Flujos de autenticación**: pantallas de onboarding, selección de rol, almacenamiento seguro de tokens.
4. **Navegación por rol**: stacks/tabs de React Navigation condicionados por rol.
5. **Experiencia del conductor**:
   - Pantalla de control de turno (iniciar/finalizar viaje).
   - Tracking de ubicación en segundo plano/primer plano con intervalo configurable.
   - Vista de progreso de ruta mostrando trayecto asignado y paradas.
6. **Experiencia del pasajero**:
   - Vista de mapa con marcadores en vivo y ficha del vehículo.
   - Selección y filtrado de rutas, lista de buses alternativos.
   - Pantalla de parada con feed de ETAs y alertas.
7. **Componentes compartidos**: wrapper de mapa, badges de ruta, tarjetas de bus, prompts de permisos de ubicación.
8. **Offline y manejo de errores**: colas para envíos pendientes, modo degradado, lógica de reconexión.
9. **Testing**: pruebas unitarias (Jest/react-native-testing-library), e2e (Detox/Expo test suite).

### 6. Estrategia de Ubicación en Tiempo Real
- **Captura de ubicación del conductor**: usar GPS de alta precisión con throttling configurable (p. ej., cada 3–5 s o cambio de 30 m).
- **Protección de batería/red**: detectar baja energía, reducir frecuencia, encolar actualizaciones offline.
- **Validación en backend**: verificar esquema del payload, limitar jitter con filtro de Kalman, ajustar a ruta con map-matching.
- **Redis pub/sub**: almacenar última ubicación por vehículo, publicar actualizaciones para suscriptores pasajeros.
- **Cálculo de ETAs**: combinar velocidad actual, distancia de ruta, promedios históricos; exponer ETAs precomputadas.

### 7. DevOps y Entrega
- **Ambientes**: dev, staging, producción con DB/Redis/WebSocket separados.
- **CI/CD**: pruebas automáticas, linting, type checks en PR; desplegar backend con contenedores (Docker + ECS/Kubernetes) o serverless (AWS Lambda + API Gateway).
- **Entrega móvil**: actualizaciones OTA con Expo Updates o CodePush; build de artefactos con EAS o fastlane.
- **Monitoreo**: agregación de logs, alertas por ausencia de actualizaciones de conductores, latencia, tasa de caída.
- **Documentación**: mantener API docs (OpenAPI/Swagger), diagramas de arquitectura, runbooks.

### 8. Lanzamiento e Iteración
- **Programa piloto**: incorporar un subconjunto de conductores, monitorizar precisión, recoger feedback.
- **Ciclo de calidad de datos**: revisar trazas GPS, ajustar filtros, actualizar datos de rutas.
- **Expansión de funcionalidades**: pagos de tarifa, feedback de pasajeros, indicadores de ocupación.
- **Analíticas**: dashboards para confiabilidad del servicio, cumplimiento de conductores, uso de pasajeros.

### Lista de Entregables
- [ ] Especificación de requisitos y journeys de usuario.
- [ ] Diagrama de arquitectura del sistema y flujo de datos.
- [ ] Esquema de PostgreSQL y migraciones.
- [ ] Backend Node.js con endpoints REST + WebSocket.
- [ ] Pipeline de ubicaciones en vivo con Redis y worker de ETAs.
- [ ] App React Native con flujos de conductor y pasajero.
- [ ] Pipelines de despliegue y configuración de ambientes.
- [ ] Documentación y runbooks operativos.

