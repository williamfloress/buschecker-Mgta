import { posicionService, unidadService } from './services';

/**
 * Simulates live bus movement by updating positions periodically in Supabase.
 * @param {Function} onUpdate - Callback function called on each update with the updated units
 * @param {number} intervalMs - Update interval in milliseconds (default: 3000)
 * @returns {() => void} - Function to stop the simulation
 */
export function startLiveSimulation(onUpdate, intervalMs = 3000) {
  let intervalId = null;
  let isRunning = false;

  const simulateMovement = async () => {
    try {
      const unidades = await unidadService.getActive();

      if (unidades.length === 0) {
        console.warn('[liveSimulation] No active units to simulate');
        return;
      }

      // Default coordinates (Isla de Margarita) for initial position
      const defaultLat = 11.0041;
      const defaultLng = -63.8497;

      for (const unidad of unidades) {
        const posicionActual = unidad.posicion_actual;

        if (!posicionActual) {
          await posicionService.updatePosition(unidad.id_unidad, {
            latitud: defaultLat + (Math.random() - 0.5) * 0.01,
            longitud: defaultLng + (Math.random() - 0.5) * 0.01,
            velocidad: 30 + Math.random() * 20,
            status: 'en_ruta',
          });
        } else {
          const currentLat = parseFloat(posicionActual.latitud);
          const currentLng = parseFloat(posicionActual.longitud);

          // Small random movement (~50-100 meters)
          const latOffset = (Math.random() - 0.5) * 0.001;
          const lngOffset = (Math.random() - 0.5) * 0.001;

          await posicionService.updatePosition(unidad.id_unidad, {
            latitud: currentLat + latOffset,
            longitud: currentLng + lngOffset,
            velocidad: 30 + Math.random() * 20,
            status: 'en_ruta',
          });
        }
      }

      if (onUpdate) {
        const updatedUnits = await unidadService.getActive();
        onUpdate(updatedUnits);
      }
    } catch (error) {
      console.error('[liveSimulation] Error in live simulation:', error);
    }
  };

  const start = () => {
    if (isRunning) return;
    isRunning = true;

    simulateMovement();
    intervalId = setInterval(simulateMovement, intervalMs);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
  };

  start();
  return stop;
}

/**
 * Calculates distance between two coordinates using Haversine formula.
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Tracks when a bus unit approaches stops along its route.
 * Calls onApproach when the unit is within the threshold distance of a stop.
 * @param {string} unidadId - Unit ID
 * @param {Array} stops - Array of stops with { id_parada, latitud, longitud, nombre }
 * @param {(payload: { stop: { nombre: string } } & Record<string, any>) => void} onApproach - Callback when approaching a stop: (payload) => void
 * @param {number} approachDistanceMeters - Distance threshold in meters (default: 100)
 * @param {number} intervalMs - Check interval in milliseconds (default: 2000)
 * @returns {() => void} - Function to stop the tracking
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

  const checkApproach = async () => {
    try {
      const currentPos = await posicionService.getCurrentPosition(unidadId);

      if (!currentPos) {
        return;
      }

      const currentLat = parseFloat(currentPos.latitud);
      const currentLng = parseFloat(currentPos.longitud);

      for (const stop of stops) {
        const stopLat = parseFloat(stop.latitud);
        const stopLng = parseFloat(stop.longitud);
        const distance = calculateDistance(
          currentLat,
          currentLng,
          stopLat,
          stopLng
        );

        if (
          distance <= approachDistanceMeters &&
          stop.id_parada !== lastApproachedStop
        ) {
          lastApproachedStop = stop.id_parada;

          if (onApproach) {
            onApproach({
              stop,
              distance: Math.round(distance),
              unitId: unidadId,
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error('[liveSimulation] Error checking stop approach:', error);
    }
  };

  const start = () => {
    if (isRunning) return;
    isRunning = true;
    checkApproach();
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

  start();
  return stop;
}
