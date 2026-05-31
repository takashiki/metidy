import { LocationTree } from '../components/locations/LocationTree';

export function LocationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">位置管理</h1>
      <LocationTree />
    </div>
  );
}