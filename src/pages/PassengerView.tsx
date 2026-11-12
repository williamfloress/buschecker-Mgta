import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw, Star, LogIn } from "lucide-react";
import MapView from "@/components/MapView";
import BusArrivalCard from "@/components/BusArrivalCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { passengerBusApi, passengerBusStopApi } from "@/lib/passengerApi";
import { favoritosService } from "@/lib/services";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Bus, BusStop } from "@shared/schema";

interface PassengerViewProps {
  onLoginRequired?: () => void;
}

export default function PassengerView({ onLoginRequired }: PassengerViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [nearbyStopIds, setNearbyStopIds] = useState<string[]>([]);

  // Fetch active buses
  const { data: buses = [], isLoading: busesLoading } = useQuery({
    queryKey: ['buses', 'active'],
    queryFn: passengerBusApi.getActive,
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Fetch all bus stops
  const { data: busStops = [], isLoading: stopsLoading } = useQuery({
    queryKey: ['bus-stops'],
    queryFn: passengerBusStopApi.getAll,
  });

  // Fetch user favorites (only if authenticated)
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id_usuario],
    queryFn: () => favoritosService.getUserFavorites(user!.id_usuario),
    enabled: !!user,
  });

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: ({ tipoFavorito, idReferencia }: { tipoFavorito: 'parada' | 'linea'; idReferencia: string }) =>
      favoritosService.addFavorite(user!.id_usuario, tipoFavorito, idReferencia),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id_usuario] });
      toast({
        title: "Favorito agregado",
        description: "La parada se ha agregado a tus favoritos.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el favorito.",
        variant: "destructive",
      });
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: (favoritoId: string) => favoritosService.removeFavorite(favoritoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id_usuario] });
      toast({
        title: "Favorito eliminado",
        description: "La parada se ha eliminado de tus favoritos.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el favorito.",
        variant: "destructive",
      });
    },
  });

  const isFavorite = (stopId: string) => {
    return favorites.some((fav: any) => fav.tipo_favorito === 'parada' && String(fav.id_referencia) === String(stopId));
  };

  const handleToggleFavorite = (stopId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para agregar favoritos.",
        variant: "destructive",
      });
      onLoginRequired?.();
      return;
    }

    const favorite = favorites.find((fav: any) => fav.tipo_favorito === 'parada' && String(fav.id_referencia) === String(stopId));
    if (favorite) {
      removeFavoriteMutation.mutate(favorite.id_favorito);
    } else {
      addFavoriteMutation.mutate({ tipoFavorito: 'parada', idReferencia: stopId });
    }
  };

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

      {/* Sidebar Section */}
      <div className="w-full lg:w-80 space-y-4 overflow-y-auto max-h-[600px] lg:max-h-full">
        {/* Favorites Section (Authenticated Only) */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5" />
                Mis Favoritos
              </CardTitle>
              <CardDescription>
                Paradas guardadas para acceso rápido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {favorites.filter((fav: any) => fav.tipo_favorito === 'parada').length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tienes paradas favoritas aún
                </p>
              ) : (
                favorites
                  .filter((fav: any) => fav.tipo_favorito === 'parada')
                  .map((fav: any) => {
                    const stop = busStops.find((s) => s.id === fav.id_referencia);
                    if (!stop) return null;
                    return (
                      <div
                        key={fav.id_favorito}
                        className="flex items-center justify-between p-2 border rounded-md hover:bg-muted"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{stop.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(stop.id)}
                          className="text-yellow-500 hover:text-yellow-600"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </Button>
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>
        )}

        {/* Login Prompt for Favorites (Not Authenticated) */}
        {!user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5" />
                Favoritos
              </CardTitle>
              <CardDescription>
                Guarda tus paradas favoritas para acceso rápido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 space-y-3">
                <LogIn className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Inicia sesión para guardar paradas favoritas
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLoginRequired}
                  className="gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nearby Stops Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" data-testid="text-nearby-stops">
              Paradas Cercanas
            </h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['buses', 'active'] });
                queryClient.invalidateQueries({ queryKey: ['bus-stops'] });
              }}
              data-testid="button-refresh-arrivals"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          {arrivalsData.map((stopData, index) => {
            const stop = busStops.find(s => s.name === stopData.stopName);
            const isFav = stop ? isFavorite(stop.id) : false;
            
            return (
              <div key={`${stopData.stopName}-${index}`} className="relative">
                <BusArrivalCard
                  stopName={stopData.stopName}
                  arrivals={stopData.arrivals}
                />
                {stop && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleToggleFavorite(stop.id)}
                    title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
                  >
                    <Star 
                      className={`w-4 h-4 ${isFav ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} 
                    />
                  </Button>
                )}
              </div>
            );
          })}
          
          {arrivalsData.length === 0 && nearbyStopIds.length === 0 && (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-nearby-stops">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron paradas cercanas</p>
              <p className="text-xs">Acércate más a una ruta de autobús</p>
            </div>
          )}
        </div>

        {/* All Stops Section - Add any stop to favorites */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Todas las paradas</CardTitle>
            <CardDescription>
              Haz clic en la estrella para agregar o quitar de favoritos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {busStops.map((stop) => {
                const isFav = isFavorite(stop.id);
                return (
                  <div
                    key={stop.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{stop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(stop.id)}
                      title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
                      className="shrink-0"
                    >
                      <Star
                        className={`w-4 h-4 ${isFav ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                      />
                    </Button>
                  </div>
                );
              })}
              {busStops.length === 0 && !stopsLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay paradas disponibles
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}