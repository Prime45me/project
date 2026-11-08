import { useState, useEffect, useCallback } from 'react';
import { Church, Plus, Users, Calendar, Pencil, Trash2, MoreHorizontal, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/format';
import type { Ministry, MinistryMember, Member } from '@/types';

export function MinistriesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ministries, setMinistries] = useState<(Ministry & { member_count?: number })[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<Ministry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ministry | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({ name: '', description: '', leader_id: '', meeting_day: '', meeting_time: '' });

  const loadMinistries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ministries')
      .select('*, leader:members!leader_id(*), assistant_leader:members!assistant_leader_id(*)')
      .eq('is_active', true)
      .order('name');
    if (!error && data) {
      const withCounts = await Promise.all(
        (data as Ministry[]).map(async (m) => {
          const { count } = await supabase.from('ministry_members').select('id', { count: 'exact', head: true }).eq('ministry_id', m.id);
          return { ...m, member_count: count || 0 };
        })
      );
      setMinistries(withCounts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadMinistries(); }, [loadMinistries]);

  const loadMembers = async () => {
    const { data } = await supabase.from('members').select('id, first_name, last_name').eq('is_archived', false).order('first_name');
    setMembers((data as Member[]) || []);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !profile?.church_id || !profile?.branch_id) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        leader_id: form.leader_id || null,
        meeting_day: form.meeting_day || null,
        meeting_time: form.meeting_time || null,
      };
      if (editTarget) {
        const { error } = await supabase.from('ministries').update(payload).eq('id', editTarget.id);
        if (error) throw error;
        toast({ title: 'Ministry updated', description: `${form.name} has been updated.` });
      } else {
        const { error } = await supabase.from('ministries').insert({ ...payload, church_id: profile.church_id, branch_id: profile.branch_id });
        if (error) throw error;
        toast({ title: 'Ministry created', description: `${form.name} has been added.` });
      }
      setDialogOpen(false);
      setEditTarget(null);
      setForm({ name: '', description: '', leader_id: '', meeting_day: '', meeting_time: '' });
      loadMinistries();
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Error', description: 'Failed to save ministry.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from('ministries').update({ is_active: false }).eq('id', deleteTarget.id);
      if (error) throw error;
      toast({ title: 'Ministry deleted', description: `${deleteTarget.name} has been removed.` });
      setDeleteTarget(null);
      loadMinistries();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete ministry.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Ministries" description="Manage church ministries and teams">
        <Button size="sm" onClick={() => { loadMembers(); setEditTarget(null); setForm({ name: '', description: '', leader_id: '', meeting_day: '', meeting_time: '' }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Ministry
        </Button>
      </PageHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : ministries.length === 0 ? (
        <EmptyState icon={<Church className="h-8 w-8" />} title="No ministries yet" description="Create your first ministry to start organizing your church teams." action={<Button onClick={() => { loadMembers(); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add Ministry</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((m) => (
            <Card key={m.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0"><Church className="h-5 w-5" /></div>
                    <div><h3 className="font-semibold">{m.name}</h3><Badge variant="secondary" className="mt-0.5 text-xs">{m.member_count || 0} members</Badge></div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { loadMembers(); setEditTarget(m); setForm({ name: m.name, description: m.description || '', leader_id: m.leader_id || '', meeting_day: m.meeting_day || '', meeting_time: m.meeting_time || '' }); setDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(m)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {m.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{m.description}</p>}
                {m.leader && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">{getInitials(m.leader.first_name, m.leader.last_name)}</div>
                    <div><p className="text-xs font-medium">{m.leader.first_name} {m.leader.last_name}</p><p className="text-[10px] text-muted-foreground">Leader</p></div>
                  </div>
                )}
                <div className="space-y-1 text-xs text-muted-foreground">
                  {m.meeting_day && <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {m.meeting_day}{m.meeting_time ? ` at ${m.meeting_time}` : ''}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTarget ? 'Edit Ministry' : 'Add New Ministry'}</DialogTitle><DialogDescription>{editTarget ? 'Update ministry information' : 'Create a new church ministry'}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Ministry Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Youth Ministry" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="space-y-2"><Label>Leader</Label><Select value={form.leader_id} onValueChange={(v) => setForm({ ...form, leader_id: v })}><SelectTrigger><SelectValue placeholder="Select a member" /></SelectTrigger><SelectContent className="max-h-[200px]">{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Meeting Day</Label><Input value={form.meeting_day} onChange={(e) => setForm({ ...form, meeting_day: e.target.value })} placeholder="e.g., Saturday" /></div>
              <div className="space-y-2"><Label>Meeting Time</Label><Input value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} placeholder="e.g., 4:00 PM" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving || !form.name.trim()}>{saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Ministry'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this ministry?</AlertDialogTitle><AlertDialogDescription>{deleteTarget?.name} will be removed. Member assignments will also be cleared.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Ministry</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
