import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Plus, Search, Download, Upload, MoreHorizontal, Pencil, Trash2, Eye, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { MemberStatusBadge } from '@/components/status-badges';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { formatDate, calculateAge } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import type { Member, MembershipStatus } from '@/types';

const PAGE_SIZE = 20;

export function MembersListPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const canManage = hasPermission(profile?.role, 'members.manage');

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('members')
        .select('*', { count: 'exact' })
        .eq('is_archived', false);

      if (search.trim()) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,member_code.ilike.%${search}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('membership_status', statusFilter);
      }

      if (genderFilter !== 'all') {
        query = query.eq('gender', genderFilter);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data, count, error } = await query;

      if (error) throw error;
      setMembers((data as Member[]) || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error loading members:', err);
      toast({
        title: 'Error',
        description: 'Failed to load members. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, genderFilter, sortBy, sortOrder, page, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      loadMembers();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, statusFilter, genderFilter, sortBy, sortOrder, loadMembers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({ is_archived: true })
        .eq('id', deleteTarget.id);

      if (error) throw error;

      await logAudit({
        action: 'archive',
        module: 'members',
        record_id: deleteTarget.id,
        record_type: 'member',
        description: `Archived member ${deleteTarget.first_name} ${deleteTarget.last_name}`,
      });

      toast({ title: 'Member archived', description: `${deleteTarget.first_name} ${deleteTarget.last_name} has been archived.` });
      setDeleteTarget(null);
      loadMembers();
    } catch (err) {
      console.error('Delete error:', err);
      toast({ title: 'Error', description: 'Failed to archive member.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Member Code', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Gender', 'Date Joined'];
    const rows = members.map((m) => [
      m.member_code || '',
      m.first_name,
      m.last_name,
      m.email || '',
      m.phone || '',
      m.membership_status,
      m.gender || '',
      formatDate(m.date_joined),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `churchconnect-members-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export complete', description: `${members.length} members exported to CSV.` });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader title="Members" description={`${total} members in your church`}>
        {canManage && (
          <>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={members.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={() => navigate('/members/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="new_member">New Member</SelectItem>
              <SelectItem value="visitor">Visitor</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="transferred">Transferred</SelectItem>
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gender</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>

          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
            const [field, order] = v.split('-');
            setSortBy(field);
            setSortOrder(order as 'asc' | 'desc');
          }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="first_name-asc">Name A-Z</SelectItem>
              <SelectItem value="first_name-desc">Name Z-A</SelectItem>
              <SelectItem value="date_joined-desc">Recent Joins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No members found"
              description={search || statusFilter !== 'all' || genderFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first church member.'}
              action={canManage && !search && statusFilter === 'all' && genderFilter === 'all' ? (
                <Button onClick={() => navigate('/members/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              ) : undefined}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="pr-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/members/${member.id}`)}
                      >
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                              {member.first_name[0]}{member.last_name[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {member.first_name} {member.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email || member.member_code || '—'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{member.phone || '—'}</TableCell>
                        <TableCell><MemberStatusBadge status={member.membership_status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {calculateAge(member.date_of_birth) ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(member.date_joined)}</TableCell>
                        <TableCell className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/members/${member.id}`)}>
                                <Eye className="mr-2 h-4 w-4" /> View Profile
                              </DropdownMenuItem>
                              {canManage && (
                                <DropdownMenuItem onClick={() => navigate(`/members/${member.id}/edit`)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              )}
                              {canManage && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteTarget(member)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Archive
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate(`/members/${member.id}`)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{member.phone || member.email || '—'}</p>
                      <div className="mt-1">
                        <MemberStatusBadge status={member.membership_status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-3">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages} ({total} members)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this member?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.first_name} {deleteTarget?.last_name} will be archived and removed from the active members list. You can restore them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Archiving...' : 'Archive Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
