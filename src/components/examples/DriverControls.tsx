import { useState } from 'react';
import DriverControls from '../DriverControls';

export default function DriverControlsExample() {
  const [isActive, setIsActive] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>('route-42');
  const [passengerCount, setPassengerCount] = useState(12);

  return (
    <div className="max-w-md">
      <DriverControls
        driverName="Sarah Johnson"
        currentRoute={currentRoute}
        isActive={isActive}
        passengerCount={passengerCount}
        onStatusChange={setIsActive}
        onRouteChange={setCurrentRoute}
        onLocationUpdate={() => console.log('Location updated')}
        onPassengerCountChange={setPassengerCount}
      />
    </div>
  );
}