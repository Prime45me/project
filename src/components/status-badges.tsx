import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MembershipStatus } from '@/types';

const STATUS_STYLES: Record<MembershipStatus, string> = {
  visitor: 'bg-blue-50 text-blue-700 border-blue-200',
  new_member: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  transferred: 'bg-purple-50 text-purple-700 border-purple-200',
  deceased: 'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_LABELS: Record<MembershipStatus, string> = {
  visitor: 'Visitor',
  new_member: 'New Member',
  active: 'Active',
  inactive: 'Inactive',
  transferred: 'Transferred',
  deceased: 'Deceased',
};

export function MemberStatusBadge({ status, className }: { status: MembershipStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn('font-medium', STATUS_STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const styles: Record<string, string> = {
    super_admin: 'bg-red-50 text-red-700 border-red-200',
    pastor: 'bg-teal-50 text-teal-700 border-teal-200',
    church_admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    accountant: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    ministry_leader: 'bg-orange-50 text-orange-700 border-orange-200',
    staff: 'bg-blue-50 text-blue-700 border-blue-200',
    volunteer: 'bg-green-50 text-green-700 border-green-200',
    member: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    pastor: 'Pastor',
    church_admin: 'Admin',
    accountant: 'Accountant',
    ministry_leader: 'Ministry Leader',
    staff: 'Staff',
    volunteer: 'Volunteer',
    member: 'Member',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', styles[role] || styles.member, className)}>
      {labels[role] || role}
    </Badge>
  );
}
