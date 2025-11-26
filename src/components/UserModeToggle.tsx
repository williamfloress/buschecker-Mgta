import { Button } from "@/components/ui/button";
import { Users, Car, Shield } from "lucide-react";

type UserMode = "passenger" | "driver" | "admin";
type UserRole = "admin" | "conductor" | "pasajero";

interface UserModeToggleProps {
  mode: UserMode;
  onModeChange: (mode: UserMode) => void;
  userRole?: UserRole;
  className?: string;
}

export default function UserModeToggle({ 
  mode, 
  onModeChange, 
  userRole,
  className = "" 
}: UserModeToggleProps) {
  // If no user role, don't show toggle (public users don't need mode switching)
  if (!userRole) {
    return null;
  }

  const isAdmin = userRole === "admin";
  const isDriver = userRole === "conductor" || userRole === "driver";
  const isPassenger = userRole === "pasajero" || userRole === "passenger";

  return (
    <div className={`flex bg-muted rounded-md p-1 ${className}`} data-testid="toggle-user-mode">
      {isPassenger && (
        <Button
          onClick={() => onModeChange("passenger")}
          variant={mode === "passenger" ? "default" : "ghost"}
          size="sm"
          className="flex-1 gap-2"
          data-testid="button-passenger-mode"
        >
          <Users className="w-4 h-4" />
          Pasajero
        </Button>
      )}
      {isDriver && (
        <Button
          onClick={() => onModeChange("driver")}
          variant={mode === "driver" ? "default" : "ghost"}
          size="sm"
          className="flex-1 gap-2"
          data-testid="button-driver-mode"
        >
          <Car className="w-4 h-4" />
          Conductor
        </Button>
      )}
      {isAdmin && (
        <Button
          onClick={() => onModeChange("admin")}
          variant={mode === "admin" ? "default" : "ghost"}
          size="sm"
          className="flex-1 gap-2"
          data-testid="button-admin-mode"
        >
          <Shield className="w-4 h-4" />
          Admin
        </Button>
      )}
    </div>
  );
}