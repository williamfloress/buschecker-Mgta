import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw } from "lucide-react";
import MapView from "@/components/MapView";
import BusArrivalCard from "@/components/BusArrivalCard";
import { useQuery } from "@tanstack/react-query";
import { busApi, busStopApi } from "@/lib/localStorageApi";
import type { Bus, BusStop } from "@shared/schema";

export default function PassengerView() {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [nearbyStopIds, setNearbyStopIds] = useState<string[]>([]);

  // Fetch active buses
  const { data: buses = [], isLoading: busesLoading } = useQuery({
    queryKey: ['buses', 'active'],
    queryFn: busApi.getActive,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch all bus stops
  const { data: busStops = [], isLoading: stopsLoading } = useQuery({
    queryKey: ['bus-stops'],
    queryFn: busStopApi.getAll,
  });

  // Create mock arrival data for demo
  const arrivalsData = nearbyStopIds.map(stopId => {
    const stop = busStops.find(s => s.id === stopId);
    const routeBuses = buses.filter(bus => bus.routeId === stop?.routeId && bus.isActive);
    
    if (routeBuses.length === 0) return null;
    
    return {
      stopName: stop?.name || 'Unknown Stop',
      arrivals: routeBuses.map(bus => ({
        busId: bus.id,
        routeId: bus.routeId,
        estimatedTime: Math.floor(Math.random() * 20) + 5, // 5-25 min random
        driverName: bus.driverName,
        isActive: bus.isActive
      }))
    };
  }).filter(Boolean) as any[];

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(newLocation);
          console.log('User location updated:', position.coords.latitude, position.coords.longitude);
          
          // Find nearby bus stops (within ~1km)
          const nearby = findNearbyStops(busStops, newLocation, 1); // 1km radius
          setNearbyStopIds(nearby.map(stop => stop.id));
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to Isla de Margarita coordinates
          const fallbackLocation = {
            latitude: 11.0041,
            longitude: -63.8497
          };
          setUserLocation(fallbackLocation);
          const nearby = findNearbyStops(busStops, fallbackLocation, 1);
          setNearbyStopIds(nearby.map(stop => stop.id));
          setIsLoadingLocation(false);
        }
      );
    } else {
      // Fallback for browsers without geolocation
      const fallbackLocation = {
        latitude: 11.0041,
        longitude: -63.8497
      };
      setUserLocation(fallbackLocation);
      const nearby = findNearbyStops(busStops, fallbackLocation, 1);
      setNearbyStopIds(nearby.map(stop => stop.id));
      setIsLoadingLocation(false);
    }
  };

  // Helper function to find nearby stops
  const findNearbyStops = (
    stops: BusStop[], 
    location: { latitude: number; longitude: number }, 
    radiusKm: number
  ) => {
    return stops.filter(stop => {
      const distance = calculateDistance(
        location.latitude, location.longitude,
        stop.latitude, stop.longitude
      );
      return distance <= radiusKm;
    }).slice(0, 5); // Limit to 5 nearest stops
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Update nearby stops when busStops data changes or location changes
  useEffect(() => {
    if (userLocation && busStops.length > 0) {
      const nearby = findNearbyStops(busStops, userLocation, 1);
      setNearbyStopIds(nearby.map(stop => stop.id));
    }
  }, [busStops, userLocation]);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4" data-testid="view-passenger">
      {/* Map Section */}
      <div className="flex-1 min-h-[400px] lg:min-h-full">
        <div className="relative h-full rounded-md overflow-hidden">
          {(busesLoading || stopsLoading) ? (
            <div className="h-full flex items-center justify-center bg-muted rounded-md">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MapView
              buses={buses}
              busStops={busStops}
              userLocation={userLocation}
              className="h-full"
            />
          )}
          
          {/* Floating Location Button */}
          <div className="absolute top-4 right-4">
            <Button
              onClick={getCurrentLocation}
              size="sm"
              variant="secondary"
              className="shadow-lg gap-2"
              disabled={isLoadingLocation}
              data-testid="button-get-location"
            >
              {isLoadingLocation ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              {isLoadingLocation ? "Buscando..." : "Mi Ubicación"}
            </Button>
          </div>
        </div>
      </div>

      {/* Arrivals Section */}
      <div className="w-full lg:w-80 space-y-4 overflow-y-auto max-h-[600px] lg:max-h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" data-testid="text-nearby-stops">
            Paradas Cercanas
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => console.log('Refresh arrivals')}
            data-testid="button-refresh-arrivals"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        {arrivalsData.map((stopData, index) => (
          <BusArrivalCard
            key={`${stopData.stopName}-${index}`}
            stopName={stopData.stopName}
            arrivals={stopData.arrivals}
          />
        ))}
        
        {arrivalsData.length === 0 && nearbyStopIds.length === 0 && (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-nearby-stops">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No se encontraron paradas cercanas</p>
            <p className="text-xs">Acércate más a una ruta de autobús</p>
          </div>
        )}
      </div>
    </div>
  );
}