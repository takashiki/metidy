import { NavLink } from 'react-router-dom';
import { Home, Package, MapPin, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/items', icon: Package, label: '物品' },
  { to: '/locations', icon: MapPin, label: '位置' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <div className="flex justify-around items-center h-14 safe-area-bottom">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}