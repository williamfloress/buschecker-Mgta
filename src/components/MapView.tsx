import { useEffect, useRef } from "react";
import L from "leaflet";
import { Bus, BusStop } from "@shared/schema";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  buses: Bus[];
  busStops: BusStop[];
  userLocation?: { latitude: number; longitude: number };
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

export default function MapView({ 
  buses, 
  busStops, 
  userLocation, 
  onMapClick, 
  className = "" 
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const busMarkersRef = useRef<L.Marker[]>([]);
  const stopMarkersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Use Isla de Margarita coordinates as default center
    const map = L.map(mapContainerRef.current).setView([11.0041, -63.8497], 11);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onMapClick]);

  // Update bus markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing bus markers safely
    busMarkersRef.current.forEach(marker => {
      try {
        if (mapRef.current && marker) {
          mapRef.current.removeLayer(marker);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    busMarkersRef.current = [];

    // Add new bus markers
    buses.forEach(bus => {
      if (!mapRef.current) return;
      
      console.log('Creating marker for bus:', bus.id, 'isActive:', bus.isActive);
      
      const busIcon = L.divIcon({
        className: `bus-marker ${bus.isActive ? 'bus-active' : 'bus-inactive'}`,
        html: `<div class="bus-icon bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-xs font-semibold shadow-lg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6v6"/>
            <path d="M15 6v6"/>
            <path d="M2 12h19.6"/>
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2L21 10"/>
            <path d="M5 18H2s-.5-1.7-.8-2.8C1.1 14.8 1 14.4 1 14s.1-.8.2-1.2L2 10"/>
            <circle cx="7" cy="18" r="2"/>
            <circle cx="17" cy="18" r="2"/>
          </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([bus.latitude, bus.longitude], { icon: busIcon })
        .bindPopup(`
          <div class="text-sm">
            <div class="font-semibold">Bus ${bus.routeId}</div>
            <div class="text-muted-foreground">Conductor: ${bus.driverName}</div>
            <div class="text-xs text-muted-foreground">
              Estado: ${bus.isActive ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        `);
      
      if (mapRef.current) {
        marker.addTo(mapRef.current);
        busMarkersRef.current.push(marker);
      }
    });
  }, [buses]);

  // Update bus stop markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing stop markers safely
    stopMarkersRef.current.forEach(marker => {
      try {
        if (mapRef.current && marker) {
          mapRef.current.removeLayer(marker);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    stopMarkersRef.current = [];

    // Add new stop markers
    busStops.forEach(stop => {
      if (!mapRef.current) return;
      
      const stopIcon = L.divIcon({
        className: 'bus-stop-marker',
        html: `<div class="bg-card border-2 border-primary rounded-full w-6 h-6 flex items-center justify-center shadow-md">
          <div class="w-2 h-2 bg-primary rounded-full"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
        .bindPopup(`
          <div class="text-sm">
            <div class="font-semibold">${stop.name}</div>
            <div class="text-xs text-muted-foreground">Parada de Autobús</div>
          </div>
        `);
      
      if (mapRef.current) {
        marker.addTo(mapRef.current);
        stopMarkersRef.current.push(marker);
      }
    });
  }, [busStops]);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing user marker safely
    if (userMarkerRef.current) {
      try {
        if (mapRef.current) {
          mapRef.current.removeLayer(userMarkerRef.current);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      userMarkerRef.current = null;
    }

    // Add user location marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div class="bg-blue-500 border-2 border-white rounded-full w-4 h-4 shadow-lg animate-pulse"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], { 
        icon: userIcon 
      })
        .bindPopup('<div class="text-sm font-semibold">Tu Ubicación</div>');
        
      if (mapRef.current) {
        userMarkerRef.current.addTo(mapRef.current);
        // Center map on user location
        mapRef.current.setView([userLocation.latitude, userLocation.longitude], 13);
      }
    }
  }, [userLocation]);

  return (
    <div 
      ref={mapContainerRef} 
      className={`w-full h-full min-h-[400px] rounded-md ${className}`}
      data-testid="map-view"
    />
  );
}