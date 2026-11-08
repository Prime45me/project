import { Outlet } from 'react-router-dom';
import { SidebarNav, MobileNav } from '@/components/layout/sidebar-nav';
import { TopBar } from '@/components/layout/top-bar';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-background">
        <SidebarNav />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
