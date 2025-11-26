import BusArrivalCard from '../BusArrivalCard';

export default function BusArrivalCardExample() {
  // todo: remove mock functionality
  const mockArrivals = [
    {
      routeNumber: "42",
      destination: "Downtown Terminal",
      estimatedMinutes: 2,
      isDelayed: false,
      busId: "bus-1"
    },
    {
      routeNumber: "15A",
      destination: "University Campus",
      estimatedMinutes: 8,
      isDelayed: true,
      busId: "bus-2"
    },
    {
      routeNumber: "101",
      destination: "Airport Express",
      estimatedMinutes: 15,
      isDelayed: false,
      busId: "bus-3"
    }
  ];

  return (
    <div className="max-w-sm">
      <BusArrivalCard
        stopName="Main Street Station"
        arrivals={mockArrivals}
      />
    </div>
  );
}