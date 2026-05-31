import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="container max-w-4xl mx-auto p-4">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}