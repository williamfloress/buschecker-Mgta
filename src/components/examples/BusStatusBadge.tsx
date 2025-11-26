import BusStatusBadge from '../BusStatusBadge';

export default function BusStatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-4 p-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Default Size</h3>
        <div className="flex gap-2">
          <BusStatusBadge status="active" />
          <BusStatusBadge status="delayed" />
          <BusStatusBadge status="offline" />
          <BusStatusBadge status="inactive" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Small Size</h3>
        <div className="flex gap-2">
          <BusStatusBadge status="active" size="sm" />
          <BusStatusBadge status="delayed" size="sm" />
          <BusStatusBadge status="offline" size="sm" />
          <BusStatusBadge status="inactive" size="sm" />
        </div>
      </div>
    </div>
  );
}