import { NavLink } from 'react-router-dom';
import { Home, Package, MapPin, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/items', icon: Package, label: '物品' },
  { to: '/locations', icon: MapPin, label: '位置' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 border-r bg-muted/30 min-h-screen p-4 gap-2">
      <h1 className="text-xl font-bold px-3 py-4">Metidy</h1>
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}