import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Users, CheckCircle } from "lucide-react";
import BusStatusBadge from "./BusStatusBadge";
import type { BusRoute } from "@shared/schema";

interface DriverControlsProps {
  driverName?: string;
  currentRoute?: string;
  isActive?: boolean;
  passengerCount?: number;
  routes?: BusRoute[];
  onStatusChange?: (isActive: boolean) => void;
  onRouteChange?: (routeId: string) => void;
  onLocationUpdate?: () => void;
  onPassengerCountChange?: (count: number) => void;
  className?: string;
}

export default function DriverControls({
  driverName = "John Driver",
  currentRoute,
  isActive = false,
  passengerCount = 0,
  routes = [],
  onStatusChange,
  onRouteChange,
  onLocationUpdate,
  onPassengerCountChange,
  className = ""
}: DriverControlsProps) {
  const [localPassengerCount, setLocalPassengerCount] = useState(passengerCount);

  const handleStatusToggle = (checked: boolean) => {
    console.log('Driver status toggled:', checked);
    onStatusChange?.(checked);
  };

  const handleRouteChange = (routeId: string) => {
    console.log('Route changed to:', routeId);
    onRouteChange?.(routeId);
  };

  const handleLocationUpdate = () => {
    console.log('Location updated');
    onLocationUpdate?.();
  };

  const handlePassengerCountChange = (change: number) => {
    const newCount = Math.max(0, localPassengerCount + change);
    setLocalPassengerCount(newCount);
    console.log('Passenger count changed to:', newCount);
    onPassengerCountChange?.(newCount);
  };

  return (
    <Card className={`w-full max-w-md ${className}`} data-testid="card-driver-controls">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2" data-testid="text-driver-title">
          <Navigation className="w-5 h-5 text-primary" />
          Panel del Conductor
        </CardTitle>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground" data-testid="text-driver-name">
            {driverName}
          </span>
          <BusStatusBadge 
            status={isActive ? "active" : "inactive"} 
            size="sm" 
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Active Status Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="active-status" className="text-sm font-medium">
            Estado del Servicio
          </Label>
          <Switch
            id="active-status"
            checked={isActive}
            onCheckedChange={handleStatusToggle}
            data-testid="switch-active-status"
          />
        </div>

        {/* Route Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Ruta Actual</Label>
          <Select value={currentRoute || ""} onValueChange={handleRouteChange}>
            <SelectTrigger data-testid="select-route">
              <SelectValue placeholder="Selecciona una ruta" />
            </SelectTrigger>
            <SelectContent>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  {route.routeNumber} - {route.routeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Update */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Ubicación</Label>
          <Button 
            onClick={handleLocationUpdate}
            variant="outline" 
            className="w-full gap-2"
            data-testid="button-update-location"
          >
            <MapPin className="w-4 h-4" />
            Actualizar Ubicación
          </Button>
        </div>

        {/* Passenger Count */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Pasajeros Actuales</Label>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => handlePassengerCountChange(-1)}
              variant="outline"
              size="sm"
              disabled={localPassengerCount <= 0}
              data-testid="button-passenger-minus"
            >
              -
            </Button>
            <div className="flex items-center gap-2 min-w-[80px] justify-center">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold" data-testid="text-passenger-count">
                {localPassengerCount}
              </span>
            </div>
            <Button
              onClick={() => handlePassengerCountChange(1)}
              variant="outline"
              size="sm"
              data-testid="button-passenger-plus"
            >
              +
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        {isActive && (
          <div className="pt-4 border-t border-border">
            <Button 
              onClick={() => console.log('End of route triggered')}
              variant="secondary"
              className="w-full gap-2"
              data-testid="button-end-route"
            >
              <CheckCircle className="w-4 h-4" />
              Finalizar Ruta
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}