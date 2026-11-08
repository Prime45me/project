import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Phone, Mail, Calendar, MoreHorizontal, Pencil, Trash2, UserCheck } from 'lucide-react';
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/format';
import { VISITOR_JOURNEY_LABELS, type Visitor, type VisitorJourneyStatus } from '@/types';

const JOURNEY_COLORS: Record<VisitorJourneyStatus, string> = {
  first_visit: 'bg-blue-50 text-blue-700 border-blue-200',
  follow_up: 'bg-amber-50 text-amber-700 border-amber-200',
  second_visit: 'bg-purple-50 text-purple-700 border-purple-200',
  new_member: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  active_member: 'bg-teal-50 text-teal-700 border-teal-200',
};

export function VisitorsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<Visitor | null>(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', email: '',
    date_of_visit: new Date().toISOString().split('T')[0],
    service_attended: 'Sunday Service', how_heard: '', invited_by: '', notes: '',
  });

  const loadVisitors = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('visitors').select('*').order('date_of_visit', { ascending: false });
    if (search.trim()) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (statusFilter !== 'all') {
      query = query.eq('journey_status', statusFilter);
    }
    const { data, error } = await query;
    if (!error && data) setVisitors(data as Visitor[]);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => loadVisitors(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadVisitors, search]);

  const handleSave = async () => {
    if (!form.first_name.trim() || !profile?.church_id || !profile?.branch_id) return;
    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || null,
        email: form.email || null,
        date_of_visit: form.date_of_visit,
        service_attended: form.service_attended || null,
        how_heard: form.how_heard || null,
        invited_by: form.invited_by || null,
        notes: form.notes || null,
      };

      if (editTarget) {
        const { error } = await supabase.from('visitors').update(payload).eq('id', editTarget.id);
        if (error) throw error;
        toast({ title: 'Visitor updated', description: `${form.first_name} ${form.last_name} has been updated.` });
      } else {
        const { error } = await supabase.from('visitors').insert({
          ...payload,
          church_id: profile.church_id,
          branch_id: profile.branch_id,
        });
        if (error) throw error;

        // Auto-create follow-up task for first-time visitors
        await supabase.from('followups').insert({
          church_id: profile.church_id,
          branch_id: profile.branch_id,
          person_type: 'visitor',
          person_name: `${form.first_name} ${form.last_name}`,
          reason: 'First-time visitor follow-up',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          contact_method: 'phone',
          notes: `Auto-generated follow-up for visitor who attended ${form.service_attended || 'service'}`,
        });

        toast({ title: 'Visitor added', description: `${form.first_name} ${form.last_name} has been recorded. A follow-up task has been created.` });
      }
      setDialogOpen(false);
      setEditTarget(null);
      setForm({ first_name: '', last_name: '', phone: '', email: '', date_of_visit: new Date().toISOString().split('T')[0], service_attended: 'Sunday Service', how_heard: '', invited_by: '', notes: '' });
      loadVisitors();
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Error', description: 'Failed to save visitor.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (v: Visitor) => {
    setEditTarget(v);
    setForm({
      first_name: v.first_name, last_name: v.last_name, phone: v.phone || '', email: v.email || '',
      date_of_visit: v.date_of_visit, service_attended: v.service_attended || 'Sunday Service',
      how_heard: v.how_heard || '', invited_by: v.invited_by || '', notes: v.notes || '',
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ first_name: '', last_name: '', phone: '', email: '', date_of_visit: new Date().toISOString().split('T')[0], service_attended: 'Sunday Service', how_heard: '', invited_by: '', notes: '' });
    setDialogOpen(true);
  };

  const updateJourney = async (v: Visitor, status: VisitorJourneyStatus) => {
    try {
      const { error } = await supabase.from('visitors').update({ journey_status: status }).eq('id', v.id);
      if (error) throw error;
      toast({ title: 'Journey updated', description: `${v.first_name} is now ${VISITOR_JOURNEY_LABELS[status]}.` });
      loadVisitors();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update journey.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Visitors" description="Track first-time and returning visitors">
        <Button size="sm" onClick={openCreate}><UserPlus className="mr-2 h-4 w-4" />Add Visitor</Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search visitors..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(VISITOR_JOURNEY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : visitors.length === 0 ? (
        <EmptyState icon={<UserPlus className="h-8 w-8" />} title="No visitors recorded" description="Add your first visitor to start tracking their journey." action={<Button onClick={openCreate}><UserPlus className="mr-2 h-4 w-4" />Add Visitor</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visitors.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">{v.first_name[0]}{v.last_name[0]}</div>
                    <div>
                      <p className="font-medium text-sm">{v.first_name} {v.last_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(v.date_of_visit)}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(v)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateJourney(v, 'new_member')}><UserCheck className="mr-2 h-4 w-4" />Convert to Member</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Badge variant="outline" className={`text-xs ${JOURNEY_COLORS[v.journey_status]}`}>{VISITOR_JOURNEY_LABELS[v.journey_status]}</Badge>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {v.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {v.phone}</p>}
                  {v.service_attended && <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {v.service_attended}</p>}
                  {v.how_heard && <p className="text-xs">Heard via: {v.how_heard}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTarget ? 'Edit Visitor' : 'Add New Visitor'}</DialogTitle><DialogDescription>{editTarget ? 'Update visitor information' : 'Record a new church visitor'}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>First Name</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+233 ..." /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Date of Visit</Label><Input type="date" value={form.date_of_visit} onChange={(e) => setForm({ ...form, date_of_visit: e.target.value })} /></div>
              <div className="space-y-2"><Label>Service Attended</Label><Input value={form.service_attended} onChange={(e) => setForm({ ...form, service_attended: e.target.value })} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>How They Heard</Label><Input value={form.how_heard} onChange={(e) => setForm({ ...form, how_heard: e.target.value })} placeholder="Friend, Social Media, Flyer..." /></div>
              <div className="space-y-2"><Label>Invited By</Label><Input value={form.invited_by} onChange={(e) => setForm({ ...form, invited_by: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.first_name.trim()}>{saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Visitor'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
