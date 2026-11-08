import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Users, MapPin, Phone } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { getInitials } from '@/lib/format';
import type { Family, Member } from '@/types';

export function FamiliesPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const canManage = hasPermission(profile?.role, 'families.manage');

  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<Family[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({ family_name: '', head_member_id: '', address: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const loadFamilies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('families')
      .select('*, head_member:members(*)')
      .order('family_name');

    if (!error && data) {
      // Load family member counts
      const familiesWithCounts = await Promise.all(
        (data as Family[]).map(async (f) => {
          const { count } = await supabase
            .from('family_members')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', f.id);
          return { ...f, member_count: count || 0 };
        })
      );
      setFamilies(familiesWithCounts as Family[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadFamilies(); }, []);

  const loadMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select('id, first_name, last_name')
      .eq('is_archived', false)
      .order('first_name');
    setMembers((data as Member[]) || []);
  };

  const handleSave = async () => {
    if (!form.family_name.trim() || !profile?.church_id || !profile?.branch_id) return;
    setSaving(true);
    try {
      const { data: newFamily, error } = await supabase
        .from('families')
        .insert({
          church_id: profile.church_id,
          branch_id: profile.branch_id,
          family_name: form.family_name,
          head_member_id: form.head_member_id || null,
          address: form.address || null,
          phone: form.phone || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      // If head member selected, also add to family_members
      if (form.head_member_id && newFamily) {
        await supabase.from('family_members').insert({
          family_id: newFamily.id,
          member_id: form.head_member_id,
          relationship: 'Head',
          is_head: true,
        });
      }

      await logAudit({ action: 'create', module: 'families', record_id: newFamily.id, description: `Created family ${form.family_name}` });
      toast({ title: 'Family created', description: `${form.family_name} has been added.` });
      setDialogOpen(false);
      setForm({ family_name: '', head_member_id: '', address: '', phone: '' });
      loadFamilies();
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Error', description: 'Failed to create family.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Families" description="Manage household and family groupings">
        {canManage && (
          <Button size="sm" onClick={() => { loadMembers(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Family
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : families.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-8 w-8" />}
          title="No families yet"
          description="Group your members into households to manage them together."
          action={canManage && (
            <Button onClick={() => { loadMembers(); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Add Family
            </Button>
          )}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => (
            <Card key={family.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{family.family_name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(family as Family & { member_count?: number }).member_count || 0} members
                    </p>
                  </div>
                </div>
                {family.head_member && (
                  <Link
                    to={`/members/${family.head_member.id}`}
                    className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 hover:bg-muted transition-colors mb-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(family.head_member.first_name, family.head_member.last_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{family.head_member.first_name} {family.head_member.last_name}</p>
                      <p className="text-[10px] text-muted-foreground">Head of Family</p>
                    </div>
                  </Link>
                )}
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {family.address && <p className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {family.address}</p>}
                  {family.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /> {family.phone}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Family</DialogTitle>
            <DialogDescription>Create a new household grouping</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Family Name</Label>
              <Input value={form.family_name} onChange={(e) => setForm({ ...form, family_name: e.target.value })} placeholder="e.g., Mensah Family" />
            </div>
            <div className="space-y-2">
              <Label>Head of Family</Label>
              <Select value={form.head_member_id} onValueChange={(v) => setForm({ ...form, head_member_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select a member" /></SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Family address" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+233 ..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.family_name.trim()}>
              {saving ? 'Saving...' : 'Create Family'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
