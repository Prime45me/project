import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Calendar, Users, TrendingUp, QrCode, ChevronRight, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/format';
import { SESSION_TYPE_LABELS, type AttendanceSession, type SessionType, type Member } from '@/types';

export function AttendancePage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [deleteSession, setDeleteSession] = useState<AttendanceSession | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    session_type: 'sunday_service' as SessionType,
    title: '',
    session_date: new Date().toISOString().split('T')[0],
  });

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .order('session_date', { ascending: false });
    if (!error && data) setSessions(data as AttendanceSession[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const loadMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select('id, first_name, last_name')
      .eq('is_archived', false)
      .order('first_name');
    setMembers((data as Member[]) || []);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !profile?.church_id || !profile?.branch_id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('attendance_sessions').insert({
        church_id: profile.church_id,
        branch_id: profile.branch_id,
        session_type: form.session_type,
        title: form.title,
        session_date: form.session_date,
      });
      if (error) throw error;
      toast({ title: 'Attendance session created', description: `${form.title} is ready for check-in.` });
      setDialogOpen(false);
      setForm({ session_type: 'sunday_service', title: '', session_date: new Date().toISOString().split('T')[0] });
      loadSessions();
    } catch (err) {
      console.error('Create error:', err);
      toast({ title: 'Error', description: 'Failed to create session.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSession) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('attendance_sessions').delete().eq('id', deleteSession.id);
      if (error) throw error;
      toast({ title: 'Session deleted', description: `${deleteSession.title} has been removed.` });
      setDeleteSession(null);
      loadSessions();
    } catch (err) {
      console.error('Delete error:', err);
      toast({ title: 'Error', description: 'Failed to delete session. You may not have permission.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const upcomingSessions = sessions.filter(s => new Date(s.session_date) >= new Date(new Date().toDateString()));
  const pastSessions = sessions.filter(s => new Date(s.session_date) < new Date(new Date().toDateString()));

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Record and track service attendance">
        <Button size="sm" onClick={() => { loadMembers(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </PageHeader>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Calendar className="h-5 w-5" /></div>
              <div><p className="text-sm text-muted-foreground">Sessions This Month</p><p className="text-2xl font-bold">{sessions.length}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></div>
              <div><p className="text-sm text-muted-foreground">Avg Attendance</p><p className="text-2xl font-bold">{sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.total_attendance, 0) / sessions.length) : 0}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
              <div><p className="text-sm text-muted-foreground">Last Sunday</p><p className="text-2xl font-bold">{pastSessions[0]?.total_attendance || 0}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No attendance sessions yet"
          description="Create your first attendance session to start recording who attends your services."
          action={<Button onClick={() => { loadMembers(); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Session</Button>}
        />
      ) : (
        <div className="space-y-6">
          {upcomingSessions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Upcoming & Today</h3>
              <Card>
                <CardContent className="p-0">
                  <SessionsTable sessions={upcomingSessions} onShowQr={(id) => navigate(`/attendance/${id}/qr-display`)} onViewDetails={(s) => navigate(`/attendance/${s.id}/details`)} onDelete={(s) => setDeleteSession(s)} />
                </CardContent>
              </Card>
            </div>
          )}
          {pastSessions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Past Sessions</h3>
              <Card>
                <CardContent className="p-0">
                  <SessionsTable sessions={pastSessions} onShowQr={(id) => navigate(`/attendance/${id}/qr-display`)} onViewDetails={(s) => navigate(`/attendance/${s.id}/details`)} onDelete={(s) => setDeleteSession(s)} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Attendance Session</DialogTitle>
            <DialogDescription>Create a session to record attendance for a service or event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select value={form.session_type} onValueChange={(v) => setForm({ ...form, session_type: v as SessionType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Session Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Sunday Service - 15th September" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.title.trim()}>{saving ? 'Creating...' : 'Create Session'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSession} onOpenChange={(open) => { if (!open) setDeleteSession(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attendance session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteSession?.title}" and all {deleteSession?.total_attendance || 0} attendance records associated with it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'Deleting...' : 'Delete Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SessionsTable({
  sessions, onShowQr, onViewDetails, onDelete,
}: {
  sessions: AttendanceSession[];
  onShowQr: (sessionId: string) => void;
  onViewDetails: (session: AttendanceSession) => void;
  onDelete: (session: AttendanceSession) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">Session</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Attendance</TableHead>
          <TableHead className="text-right pr-6">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell className="pl-6 font-medium">{session.title}</TableCell>
            <TableCell><Badge variant="secondary" className="text-xs">{SESSION_TYPE_LABELS[session.session_type]}</Badge></TableCell>
            <TableCell className="text-sm text-muted-foreground">{formatDate(session.session_date)}</TableCell>
            <TableCell className="text-right font-semibold">{session.total_attendance}</TableCell>
            <TableCell className="text-right pr-6">
              <div className="flex items-center justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-primary"
                  onClick={() => onShowQr(session.id)}
                >
                  <QrCode className="h-4 w-4" />
                  QR
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1"
                  onClick={() => onViewDetails(session)}
                >
                  Details
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => onDelete(session)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
