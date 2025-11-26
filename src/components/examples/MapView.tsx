import MapView from '../MapView';
import { Bus, BusStop } from '@shared/schema';

export default function MapViewExample() {
  // todo: remove mock functionality
  const mockBuses: Bus[] = [
    {
      id: '1',
      routeId: 'route-1',
      driverName: 'John Smith',
      latitude: 40.7128,
      longitude: -74.0060,
      isActive: true,
      lastUpdate: new Date(),
    },
    {
      id: '2', 
      routeId: 'route-2',
      driverName: 'Sarah Johnson',
      latitude: 40.7589,
      longitude: -73.9851,
      isActive: false,
      lastUpdate: new Date(),
    }
  ];

  const mockBusStops: BusStop[] = [
    {
      id: '1',
      name: 'Main Street Station',
      latitude: 40.7200,
      longitude: -74.0100,
      routeId: 'route-1',
    },
    {
      id: '2',
      name: 'Central Park South',
      latitude: 40.7600,
      longitude: -73.9800,
      routeId: 'route-2',
    }
  ];

  const userLocation = {
    latitude: 40.7128,
    longitude: -74.0060
  };

  return (
    <div className="w-full h-[500px]">
      <MapView
        buses={mockBuses}
        busStops={mockBusStops}
        userLocation={userLocation}
        onMapClick={(lat, lng) => console.log('Map clicked:', lat, lng)}
      />
    </div>
  );
}