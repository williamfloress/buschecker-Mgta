import { useState, useEffect, useRef } from "react";
import MapView from "@/components/MapView";
import DriverControls from "@/components/DriverControls";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { busApi as localStorageBusApi, busStopApi as localStorageBusStopApi, routeApi as localStorageRouteApi } from "@/lib/localStorageApi";
import { busApi as supabaseBusApi, busStopApi as supabaseBusStopApi, routeApi as supabaseRouteApi } from "@/lib/api";
import { startLiveSimulation, startStopApproachTracking } from "@/lib/liveSimulation";
import type { Bus, BusStop, BusRoute } from "@shared/schema";
import { RefreshCw } from "lucide-react";

export default function DriverView() {
  const queryClient = useQueryClient();
  const [driverBusId, setDriverBusId] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const stopSimulationRef = useRef<(() => void) | null>(null);
  const stopApproachTrackingRef = useRef<(() => void) | null>(null);

  // For demo purposes, create or get the current driver's bus (only when NOT simulating)
  useEffect(() => {
    if (isSimulating) return;

    const savedDriverBusId = localStorage.getItem('driverBusId');
    if (savedDriverBusId) {
      setDriverBusId(savedDriverBusId);
    } else {
      localStorageBusApi.create({
        routeId: 'RA-1',
        driverName: 'Current Driver',
        latitude: 11.0041,
        longitude: -63.8497,
        isActive: false
      }).then(newBus => {
        setDriverBusId(newBus.id);
        localStorage.setItem('driverBusId', newBus.id);
      });
    }
  }, [isSimulating]);

  // Fetch all buses (Supabase when simulating, localStorage otherwise)
  const { data: allBuses = [], isLoading: busesLoading } = useQuery({
    queryKey: ['buses', isSimulating],
    queryFn: isSimulating ? supabaseBusApi.getAll : localStorageBusApi.getAll,
    refetchInterval: isSimulating ? 3000 : 15000,
  });

  // Fetch all bus stops
  const { data: busStops = [], isLoading: stopsLoading } = useQuery({
    queryKey: ['bus-stops', isSimulating],
    queryFn: isSimulating ? supabaseBusStopApi.getAll : localStorageBusStopApi.getAll,
  });

  // Fetch all routes
  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['routes', isSimulating],
    queryFn: isSimulating ? supabaseRouteApi.getAll : localStorageRouteApi.getAll,
  });

  // When simulating, use first bus as driver bus (persist selection)
  const effectiveDriverBusId = isSimulating
    ? (allBuses[0]?.id ?? driverBusId)
    : driverBusId;

  const toggleSimulation = () => {
    if (isSimulating) {
      if (stopSimulationRef.current) {
        stopSimulationRef.current();
        stopSimulationRef.current = null;
      }
      if (stopApproachTrackingRef.current) {
        stopApproachTrackingRef.current();
        stopApproachTrackingRef.current = null;
      }
      setIsSimulating(false);
      setDriverBusId(localStorage.getItem('driverBusId') || '');
    } else {
      const stopSim = startLiveSimulation(
        () => queryClient.invalidateQueries({ queryKey: ['buses', true] }),
        3000
      );
      stopSimulationRef.current = stopSim;
      setIsSimulating(true);
    }
  };

  // Start stop approach tracking when simulating with Supabase buses
  useEffect(() => {
    if (!isSimulating || allBuses.length === 0) return;
    const driverBus = allBuses[0];
    if (!driverBus?.routeId) return;

    supabaseBusStopApi.getByRoute(driverBus.routeId)
      .then(stops => {
        if (stops.length === 0) return;
        const paradas = stops.map(s => ({
          id_parada: s.id,
          latitud: s.latitude,
          longitud: s.longitude,
          nombre: s.name
        }));
        if (stopApproachTrackingRef.current) {
          stopApproachTrackingRef.current();
        }
        stopApproachTrackingRef.current = startStopApproachTracking(
          driverBus.id,
          paradas,
          (payload) => console.log('[DriverView] Aproximándose a parada:', payload.stop.nombre),
          100,
          2000
        );
      })
      .catch(() => {});

    return () => {
      if (stopApproachTrackingRef.current) {
        stopApproachTrackingRef.current();
        stopApproachTrackingRef.current = null;
      }
    };
  }, [isSimulating, allBuses[0]?.id, allBuses[0]?.routeId]);

  // Find the current driver's bus
  const driverBus = allBuses.find(bus => bus.id === effectiveDriverBusId) || {
    id: effectiveDriverBusId,
    routeId: '',
    driverName: 'Current Driver',
    latitude: 11.0041,
    longitude: -63.8497,
    isActive: false,
    lastUpdate: new Date(),
  } as Bus;
  
  // Other buses (excluding driver's bus)
  const otherBuses = allBuses.filter(bus => bus.id !== effectiveDriverBusId);
  
  // Mutation for updating bus location
  const updateLocationMutation = useMutation({
    mutationFn: ({ latitude, longitude, isActive }: { latitude: number; longitude: number; isActive?: boolean }) =>
      isSimulating
        ? supabaseBusApi.updateLocation(effectiveDriverBusId, { latitude, longitude, isActive })
        : localStorageBusApi.updateLocation(effectiveDriverBusId, latitude, longitude, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses', isSimulating] });
    },
  });

  const handleStatusChange = (isActive: boolean) => {
    if (effectiveDriverBusId) {
      updateLocationMutation.mutate({ 
        latitude: driverBus.latitude, 
        longitude: driverBus.longitude, 
        isActive 
      });
    }
  };

  const handleRouteChange = (routeId: string) => {
    if (!effectiveDriverBusId) return;

    const api = isSimulating ? supabaseBusApi : localStorageBusApi;
    api.update(effectiveDriverBusId, { routeId })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['buses', isSimulating] });
      })
      .catch(error => {
        console.error('Failed to update route:', error);
      });
  };

  const handleLocationUpdate = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Driver location updated:', latitude, longitude);
          updateLocationMutation.mutate({ 
            latitude, 
            longitude, 
            isActive: driverBus.isActive 
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Simulate location update for demo
          const randomLat = 11.0041 + (Math.random() - 0.5) * 0.01;
          const randomLng = -63.8497 + (Math.random() - 0.5) * 0.01;
          console.log('Simulated location update:', randomLat, randomLng);
          updateLocationMutation.mutate({ 
            latitude: randomLat, 
            longitude: randomLng, 
            isActive: driverBus.isActive 
          });
        }
      );
    }
  };

  const handlePassengerCountChange = (count: number) => {
    // In a real app, this would update the passenger count in the backend
  };

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (stopSimulationRef.current) {
        stopSimulationRef.current();
        stopSimulationRef.current = null;
      }
      if (stopApproachTrackingRef.current) {
        stopApproachTrackingRef.current();
        stopApproachTrackingRef.current = null;
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4" data-testid="view-driver">
      {/* Map Section */}
      <div className="flex-1 min-h-[400px] lg:min-h-full">
        {(busesLoading || stopsLoading) ? (
          <div className="h-full flex items-center justify-center bg-muted rounded-md">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MapView
            buses={[driverBus, ...otherBuses]}
            busStops={busStops}
            userLocation={{ 
              latitude: driverBus.latitude, 
              longitude: driverBus.longitude 
            }}
            onMapClick={(lat, lng) => {
              if (effectiveDriverBusId) {
                updateLocationMutation.mutate({ 
                  latitude: lat, 
                  longitude: lng, 
                  isActive: driverBus.isActive 
                });
              }
            }}
            className="h-full"
          />
        )}
      </div>

      {/* Driver Controls Section */}
      <div className="w-full lg:w-80">
        <DriverControls
          driverName={driverBus.driverName}
          currentRoute={driverBus.routeId}
          isActive={driverBus.isActive}
          routes={routes}
          passengerCount={15}
          isSimulating={isSimulating}
          onStatusChange={handleStatusChange}
          onRouteChange={handleRouteChange}
          onLocationUpdate={handleLocationUpdate}
          onPassengerCountChange={handlePassengerCountChange}
          onSimulationToggle={toggleSimulation}
        />
      </div>
    </div>
  );
}