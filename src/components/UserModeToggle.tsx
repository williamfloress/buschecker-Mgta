import { Button } from "@/components/ui/button";
import { Users, Car } from "lucide-react";

type UserMode = "passenger" | "driver";

interface UserModeToggleProps {
  mode: UserMode;
  onModeChange: (mode: UserMode) => void;
  className?: string;
}

export default function UserModeToggle({ 
  mode, 
  onModeChange, 
  className = "" 
}: UserModeToggleProps) {
  return (
    <div className={`flex bg-muted rounded-md p-1 ${className}`} data-testid="toggle-user-mode">
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
    </div>
  );
}