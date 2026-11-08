import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Church,
  Settings,
  ClipboardList,
  Bell,
  BookOpen,
  HandHeart,
  Wallet,
  MessageSquare,
  ScanLine,
  FileText,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  permissions: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, permissions: ['dashboard.view'] },
  { label: 'Members', to: '/members', icon: Users, permissions: ['members.view'] },
  { label: 'Events', to: '/events', icon: CalendarDays, permissions: ['events.view'] },
  { label: 'Attendance', to: '/attendance', icon: ClipboardList, permissions: ['attendance.view'] },
  { label: 'QR Scanner', to: '/qr-scanner', icon: ScanLine, permissions: ['attendance.view'] },
  { label: 'Visitors', to: '/visitors', icon: UserPlus, permissions: ['dashboard.view'] },
  { label: 'Ministries', to: '/ministries', icon: Church, permissions: ['ministries.view'] },
  { label: 'Follow-ups', to: '/followups', icon: Bell, permissions: ['dashboard.view'] },
  { label: 'Discipleship', to: '/discipleship', icon: BookOpen, permissions: ['dashboard.view'] },
  { label: 'Finance', to: '/finance', icon: Wallet, permissions: ['dashboard.view'] },
  { label: 'Giving', to: '/giving', icon: HandHeart, permissions: ['dashboard.view'] },
  { label: 'Prayer Requests', to: '/prayer-requests', icon: MessageSquare, permissions: ['dashboard.view'] },
  { label: 'Documents', to: '/documents', icon: FileText, permissions: ['dashboard.view'] },
  { label: 'Reports', to: '/reports', icon: ClipboardList, permissions: ['reports.view'] },
  { label: 'Settings', to: '/settings', icon: Settings, permissions: ['settings.view'] },
];

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const { profile, hasPermission } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.permissions.some((p) => hasPermission(p))
  );

  return (
    <nav className="flex flex-col gap-0.5 px-3 py-4 overflow-y-auto scrollbar-thin">
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-16 items-center justify-center shrink-0">
            <img src="/HCI_Logo_1.png" alt="Harvest International Ministries" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-foreground">Harvest Connect</p>
            <p className="text-xs text-muted-foreground truncate">Harvest International Ministries</p>
          </div>
        </div>
      </div>
      <div className="h-px bg-border mx-3 mb-2" />
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )
          }
        >
          <item.icon className="h-4.5 w-4.5 shrink-0" style={{ width: '1.125rem', height: '1.125rem' }} />
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {item.badge}
            </span>
          )}
        </NavLink>
      ))}
      <div className="mt-auto px-3 pt-4">
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-0.5">{profile?.first_name} {profile?.last_name}</p>
          <p className="capitalize">{(profile?.role || 'member').replace('_', ' ')}</p>
        </div>
      </div>
    </nav>
  );
}

export function MobileNav() {
  const { hasPermission } = useAuth();
  const role = useAuth().profile?.role as UserRole | undefined;

  const allItems = NAV_ITEMS.filter((item) =>
    item.permissions.some((p) => hasPermission(p))
  );

  const primaryItems = ['/dashboard', '/members', '/visitors', '/attendance', '/settings'];
  const mobileItems = allItems.filter((item) => primaryItems.includes(item.to));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-background md:hidden safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1.5">
        {mobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors min-w-[56px]',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate max-w-[64px]">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
