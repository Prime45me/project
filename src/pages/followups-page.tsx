import { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, CheckCircle2, Clock, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/format';
import { FOLLOWUP_STATUS_LABELS, type Followup, type FollowupStatus } from '@/types';

const STATUS_COLORS: Record<FollowupStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  unable_to_contact: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_ICONS: Record<FollowupStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  in_progress: <Phone className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
  unable_to_contact: <AlertCircle className="h-4 w-4" />,
};

export function FollowupsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ person_name: '', reason: '', due_date: '', assigned_to_name: '', contact_method: 'phone', notes: '' });

  const loadFollowups = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('followups').select('*').order('created_at', { ascending: false });
    if (!error && data) setFollowups(data as Followup[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadFollowups(); }, [loadFollowups]);

  const handleCreate = async () => {
    if (!form.person_name.trim() || !form.reason.trim() || !profile?.church_id || !profile?.branch_id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('followups').insert({
        church_id: profile.church_id,
        branch_id: profile.branch_id,
        person_type: 'visitor',
        person_name: form.person_name,
        reason: form.reason,
        due_date: form.due_date || null,
        assigned_to_name: form.assigned_to_name || null,
        contact_method: form.contact_method,
        notes: form.notes || null,
      });
      if (error) throw error;
      toast({ title: 'Follow-up created', description: `Task created for ${form.person_name}.` });
      setDialogOpen(false);
      setForm({ person_name: '', reason: '', due_date: '', assigned_to_name: '', contact_method: 'phone', notes: '' });
      loadFollowups();
    } catch (err) {
      console.error('Create error:', err);
      toast({ title: 'Error', description: 'Failed to create follow-up.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (f: Followup, status: FollowupStatus) => {
    try {
      const { error } = await supabase.from('followups').update({ status }).eq('id', f.id);
      if (error) throw error;
      toast({ title: 'Status updated', description: `Follow-up marked as ${FOLLOWUP_STATUS_LABELS[status]}.` });
      loadFollowups();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  const pending = followups.filter(f => f.status === 'pending');
  const inProgress = followups.filter(f => f.status === 'in_progress');
  const completed = followups.filter(f => f.status === 'completed');
  const unable = followups.filter(f => f.status === 'unable_to_contact');

  return (
    <div className="space-y-6">
      <PageHeader title="Follow-ups" description={`${pending.length} pending follow-up tasks`}>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />New Follow-up</Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Clock className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold">{pending.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Phone className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">In Progress</p><p className="text-xl font-bold">{inProgress.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Completed</p><p className="text-xl font-bold">{completed.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600"><AlertCircle className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Unable to Contact</p><p className="text-xl font-bold">{unable.length}</p></div></CardContent></Card>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : followups.length === 0 ? (
        <EmptyState icon={<Bell className="h-8 w-8" />} title="No follow-ups yet" description="Follow-up tasks are automatically created for new visitors. You can also create them manually." action={<Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />New Follow-up</Button>} />
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({inProgress.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="unable">Unable ({unable.length})</TabsTrigger>
          </TabsList>
          {(['pending', 'in_progress', 'completed', 'unable_to_contact'] as FollowupStatus[]).map((status) => {
            const items = followups.filter(f => f.status === status);
            return (
              <TabsContent key={status} value={status === 'unable_to_contact' ? 'unable' : status}>
                {items.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No follow-ups in this category.</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((f) => (
                      <Card key={f.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">{STATUS_ICONS[f.status]}</div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{f.person_name}</p>
                                <p className="text-xs text-muted-foreground">{f.reason}</p>
                                {f.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.notes}</p>}
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  {f.assigned_to_name && <span>Assigned: {f.assigned_to_name}</span>}
                                  {f.due_date && <span>Due: {formatDate(f.due_date)}</span>}
                                  {f.contact_method && <span className="capitalize">via {f.contact_method}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className={`text-xs ${STATUS_COLORS[f.status]}`}>{FOLLOWUP_STATUS_LABELS[f.status]}</Badge>
                              <Select value={f.status} onValueChange={(v) => updateStatus(f, v as FollowupStatus)}>
                                <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(FOLLOWUP_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Follow-up Task</DialogTitle><DialogDescription>Create a follow-up task for a visitor or member.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Person Name</Label><Input value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Reason</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g., First-time visitor follow-up" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Assigned To</Label><Input value={form.assigned_to_name} onChange={(e) => setForm({ ...form, assigned_to_name: e.target.value })} placeholder="Staff member name" /></div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Contact Method</Label><Select value={form.contact_method} onValueChange={(v) => setForm({ ...form, contact_method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="phone">Phone Call</SelectItem><SelectItem value="visit">Home Visit</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving || !form.person_name.trim() || !form.reason.trim()}>{saving ? 'Creating...' : 'Create Task'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
