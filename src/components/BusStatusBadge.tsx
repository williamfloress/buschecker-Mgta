import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

type BusStatus = "active" | "delayed" | "offline" | "inactive";

interface BusStatusBadgeProps {
  status: BusStatus;
  size?: "sm" | "default";
  className?: string;
}

export default function BusStatusBadge({ 
  status, 
  size = "default", 
  className = "" 
}: BusStatusBadgeProps) {
  const getStatusConfig = (status: BusStatus) => {
    switch (status) {
      case "active":
        return {
          icon: CheckCircle,
          text: "Activo",
          className: "bg-success/10 text-success border-success/20",
        };
      case "delayed":
        return {
          icon: Clock,
          text: "Retrasado",
          className: "bg-warning/10 text-warning border-warning/20",
        };
      case "offline":
        return {
          icon: XCircle,
          text: "Sin conexión",
          className: "bg-destructive/10 text-destructive border-destructive/20",
        };
      case "inactive":
        return {
          icon: AlertTriangle,
          text: "Inactivo",
          className: "bg-muted/50 text-muted-foreground border-muted/50",
        };
      default:
        return {
          icon: AlertTriangle,
          text: "Desconocido",
          className: "bg-muted/50 text-muted-foreground border-muted/50",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${textSize} gap-1 ${className}`}
      data-testid={`badge-status-${status}`}
    >
      <Icon className={iconSize} />
      {config.text}
    </Badge>
  );
}