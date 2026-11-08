import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Plus, MapPin, Clock, User, DollarSign, Users, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/lib/format';
import { EVENT_STATUS_LABELS, type ChurchEvent, type EventStatus } from '@/types';

const STATUS_COLORS: Record<EventStatus, string> = {
  upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  ongoing: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export function EventsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<ChurchEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChurchEvent | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', event_date: '', start_time: '', end_time: '',
    venue: '', speaker: '', organizer: '', registration_required: false,
    registration_limit: '', registration_fee: '', status: 'upcoming' as EventStatus,
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: false });
    if (!error && data) setEvents(data as ChurchEvent[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.event_date || !profile?.church_id || !profile?.branch_id) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        event_date: form.event_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        venue: form.venue || null,
        speaker: form.speaker || null,
        organizer: form.organizer || null,
        registration_required: form.registration_required,
        registration_limit: form.registration_limit ? parseInt(form.registration_limit) : null,
        registration_fee: form.registration_fee ? parseFloat(form.registration_fee) : 0,
        status: form.status,
      };
      if (editTarget) {
        const { error } = await supabase.from('events').update(payload).eq('id', editTarget.id);
        if (error) throw error;
        toast({ title: 'Event updated', description: `${form.title} has been updated.` });
      } else {
        const { error } = await supabase.from('events').insert({ ...payload, church_id: profile.church_id, branch_id: profile.branch_id });
        if (error) throw error;
        toast({ title: 'Event created', description: `${form.title} has been added.` });
      }
      setDialogOpen(false);
      setEditTarget(null);
      setForm({ title: '', description: '', event_date: '', start_time: '', end_time: '', venue: '', speaker: '', organizer: '', registration_required: false, registration_limit: '', registration_fee: '', status: 'upcoming' });
      loadEvents();
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Error', description: 'Failed to save event.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast({ title: 'Event deleted', description: `${deleteTarget.title} has been removed.` });
      setDeleteTarget(null);
      loadEvents();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' });
    }
  };

  const openEdit = (e: ChurchEvent) => {
    setEditTarget(e);
    setForm({
      title: e.title, description: e.description || '', event_date: e.event_date,
      start_time: e.start_time || '', end_time: e.end_time || '', venue: e.venue || '',
      speaker: e.speaker || '', organizer: e.organizer || '',
      registration_required: e.registration_required,
      registration_limit: e.registration_limit?.toString() || '',
      registration_fee: e.registration_fee?.toString() || '',
      status: e.status,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ title: '', description: '', event_date: '', start_time: '', end_time: '', venue: '', speaker: '', organizer: '', registration_required: false, registration_limit: '', registration_fee: '', status: 'upcoming' });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Events" description="Manage church events and registrations">
        <Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Event</Button>
      </PageHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : events.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No events yet" description="Create your first church event to start managing registrations." action={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Event</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <Card key={e.id} className="overflow-hidden flex flex-col">
              <CardContent className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{e.title}</h3>
                    <Badge variant="outline" className={`text-xs mt-1 ${STATUS_COLORS[e.status]}`}>{EVENT_STATUS_LABELS[e.status]}</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(e)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(e)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {e.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{e.description}</p>}
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(e.event_date)}</p>
                  {e.start_time && <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {e.start_time}{e.end_time ? ` - ${e.end_time}` : ''}</p>}
                  {e.venue && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {e.venue}</p>}
                  {e.speaker && <p className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> {e.speaker}</p>}
                  {e.registration_required && (
                    <p className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" /> {e.registration_fee > 0 ? formatCurrency(e.registration_fee) : 'Free'} {e.registration_limit && `· Limit: ${e.registration_limit}`}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editTarget ? 'Edit Event' : 'Add New Event'}</DialogTitle><DialogDescription>{editTarget ? 'Update event details' : 'Create a new church event'}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Event Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Easter Convention 2026" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Start Time</Label><Input value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} placeholder="6:00 PM" /></div>
              <div className="space-y-2"><Label>End Time</Label><Input value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} placeholder="9:00 PM" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
              <div className="space-y-2"><Label>Speaker</Label><Input value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Organizer</Label><Input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} /></div>
            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as EventStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EVENT_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div><Label>Registration Required</Label><p className="text-xs text-muted-foreground">Members must register to attend</p></div>
              <Switch checked={form.registration_required} onCheckedChange={(v) => setForm({ ...form, registration_required: v })} />
            </div>
            {form.registration_required && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Registration Limit</Label><Input type="number" value={form.registration_limit} onChange={(e) => setForm({ ...form, registration_limit: e.target.value })} placeholder="Max attendees" /></div>
                <div className="space-y-2"><Label>Registration Fee (GH₵)</Label><Input type="number" value={form.registration_fee} onChange={(e) => setForm({ ...form, registration_fee: e.target.value })} placeholder="0.00" /></div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.event_date}>{saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Event'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this event?</AlertDialogTitle><AlertDialogDescription>{deleteTarget?.title} will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Event</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
