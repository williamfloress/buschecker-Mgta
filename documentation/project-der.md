## Modelo Entidad–Relación: App de Rastreo de Buses

### Entidades y Atributos

- **Línea**
  - `id_linea`
  - `nombre`
  - `tarifa`

- **Ruta_Parada** (entidad débil asociativa)
  - `orden`

- **Parada**
  - `id_parada`
  - `nombre`
  - `latitud`
  - `longitud`
  - `direccion`

- **Unidad**
  - `id_unidad`
  - `placa`
  - `modelo`

- **Posicion_Actual**
  - `timestamp`
  - `latitud`
  - `longitud`
  - `velocidad`
  - `status`

- **Usuario**
  - `id_usuario`
  - `nombre`
  - `email`
  - `password`
  - `rol` (diferencia conductor vs pasajero)

- **Favoritos**
  - (atributos no detallados en el diagrama; se asume referencia a paradas o líneas favoritas del usuario)

### Relaciones y Cardinalidades

- **Línea recorre Ruta_Parada** (`0..N` rutas por línea / `0..N` líneas por ruta_parada)
  - `Ruta_Parada` actúa como entidad débil para ordenar las paradas que conforman una línea.
  - Depende de `Línea` y se vincula a `Parada` mediante la relación *Guarda*.

- **Ruta_Parada guarda Parada** (`0..N` paradas listadas / cada `Ruta_Parada` referencia una `Parada`)
  - Permite asociar cada registro de `Ruta_Parada` con la parada concreta y su posición en la ruta.

- **Línea tiene Unidad** (`0..N` unidades por línea / cada unidad pertenece a `1` línea)
  - Modela los vehículos operativos disponibles para una ruta.

- **Unidad conduce Usuario** (`1` conductor por unidad / `1` unidad por conductor)
  - Restringe la asignación de conductores: un usuario con rol conductor maneja una sola unidad activa.

- **Unidad reporta Posicion_Actual** (`1` reporte activo por unidad / cada posición pertenece a `1` unidad)
  - Captura la localización transmitida por el dispositivo del conductor.

- **Posicion_Actual almacena** (relación opcional `0..1`; el diagrama sugiere almacenamiento histórico sin detallar entidad destino)
  - Se interpreta como la persistencia de posiciones para análisis o histórico.

- **Usuario registra Favoritos** (`0..N` favoritos por usuario / cada favorito asociado a `1` usuario)
  - Permite que pasajeros (o incluso conductores) definan elementos de seguimiento rápido.

### Observaciones

- `Ruta_Parada` carece de clave propia en el diagrama; se recomienda clave compuesta (`id_linea`, `id_parada`) más el atributo `orden`.
- No se detallan las entidades asociadas a la relación *Almacena*; podría derivar en una tabla histórica (`Posicion_Historica`) o en almacenamiento en otra estructura.
- `Favoritos` no muestra atributos ni relaciones adicionales (p. ej. con `Línea` o `Parada`). Será necesario concretar qué tipo de elemento se marca como favorito.
- Aun cuando la relación *Conduce* es 1:1, en la implementación puede requerirse historial para permitir que un usuario conduzca distintas unidades en momentos diferentes.

