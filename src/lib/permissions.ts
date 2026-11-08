import type { UserRole } from '@/types';

const PERMISSION_MATRIX: Record<UserRole, string[]> = {
  super_admin: ['*'],
  pastor: [
    'dashboard.view',
    'members.view',
    'members.manage',
    'attendance.view',
    'attendance.manage',
    'branches.view',
    'families.view',
    'families.manage',
    'reports.view',
    'followups.view',
    'followups.manage',
    'prayer_requests.view',
    'events.view',
    'ministries.view',
    'settings.view',
  ],
  church_admin: [
    'dashboard.view',
    'members.view',
    'members.manage',
    'attendance.view',
    'attendance.manage',
    'branches.view',
    'branches.manage',
    'families.view',
    'families.manage',
    'reports.view',
    'followups.view',
    'followups.manage',
    'prayer_requests.view',
    'events.view',
    'events.manage',
    'ministries.view',
    'ministries.manage',
    'settings.view',
    'settings.manage',
    'users.manage',
    'audit_logs.view',
  ],
  accountant: [
    'dashboard.view',
    'members.view',
    'finance.view',
    'finance.manage',
    'giving.view',
    'giving.manage',
    'reports.view',
    'branches.view',
  ],
  ministry_leader: [
    'dashboard.view',
    'members.view',
    'ministries.view',
    'ministries.manage_own',
    'attendance.view',
    'events.view',
  ],
  staff: [
    'dashboard.view',
    'members.view',
    'members.manage',
    'attendance.view',
    'attendance.manage',
    'branches.view',
    'families.view',
    'events.view',
  ],
  volunteer: [
    'dashboard.view',
    'members.view',
    'attendance.view',
  ],
  member: [
    'dashboard.view',
    'profile.view_own',
  ],
};

export function hasPermission(role: UserRole | undefined, permission: string): boolean {
  if (!role) return false;
  const permissions = PERMISSION_MATRIX[role];
  if (!permissions) return false;
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole | undefined, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function canManageMembers(role: UserRole | undefined): boolean {
  return hasPermission(role, 'members.manage');
}

export function canManageBranches(role: UserRole | undefined): boolean {
  return hasPermission(role, 'branches.manage');
}

export function canManageSettings(role: UserRole | undefined): boolean {
  return hasPermission(role, 'settings.manage');
}

export function canViewAuditLogs(role: UserRole | undefined): boolean {
  return hasPermission(role, 'audit_logs.view');
}
