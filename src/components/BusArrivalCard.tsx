import { Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BusStatusBadge from "@/components/BusStatusBadge";

interface BusArrival {
  routeNumber: string;
  destination: string;
  estimatedMinutes: number;
  isDelayed: boolean;
  busId: string;
}

interface BusArrivalCardProps {
  stopName: string;
  arrivals: BusArrival[];
  className?: string;
}

export default function BusArrivalCard({ 
  stopName, 
  arrivals, 
  className = "" 
}: BusArrivalCardProps) {
  const getArrivalTime = (minutes: number) => {
    if (minutes <= 1) return "Ahora";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getArrivalColor = (minutes: number, isDelayed: boolean) => {
    if (isDelayed) return "text-warning";
    if (minutes <= 5) return "text-success";
    return "text-foreground";
  };

  return (
    <Card className={`hover-elevate ${className}`} data-testid={`card-arrival-${stopName.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm" data-testid="text-stop-name">{stopName}</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {arrivals.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-no-arrivals">
            No hay autobuses programados
          </p>
        ) : (
          arrivals.map((arrival, index) => (
            <div 
              key={`${arrival.busId}-${index}`} 
              className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
              data-testid={`row-arrival-${arrival.routeNumber}-${index}`}
            >
              <div className="flex items-center gap-3">
                <Badge 
                  variant="secondary" 
                  className="font-mono font-semibold min-w-[60px] justify-center"
                  data-testid={`badge-route-${arrival.routeNumber}`}
                >
                  {arrival.routeNumber}
                </Badge>
                <div>
                  <p className="text-sm font-medium" data-testid={`text-destination-${arrival.busId}`}>
                    {arrival.destination}
                  </p>
                  {arrival.isDelayed && (
                    <BusStatusBadge status="delayed" size="sm" />
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span 
                    className={`text-sm font-semibold ${getArrivalColor(arrival.estimatedMinutes, arrival.isDelayed)}`}
                    data-testid={`text-time-${arrival.busId}`}
                  >
                    {getArrivalTime(arrival.estimatedMinutes)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}