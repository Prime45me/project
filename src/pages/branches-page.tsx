import { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Phone, Mail, Pencil, Trash2, Users } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import type { Branch } from '@/types';

export function BranchesPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const canManage = hasPermission(profile?.role, 'branches.manage');

  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  const loadBranches = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('branches').select('*').eq('is_active', true);
    if (!error && data) {
      setBranches(data as Branch[]);
      // Count members per branch
      const counts: Record<string, number> = {};
      for (const b of data as Branch[]) {
        const { count } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('branch_id', b.id)
          .eq('is_archived', false);
        counts[b.id] = count || 0;
      }
      setMemberCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => { loadBranches(); }, []);

  const handleSave = async () => {
    if (!form.name.trim() || !profile?.church_id) return;
    setSaving(true);
    try {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (editingBranch) {
        const { error } = await supabase
          .from('branches')
          .update({
            name: form.name,
            address: form.address || null,
            phone: form.phone || null,
            email: form.email || null,
          })
          .eq('id', editingBranch.id);
        if (error) throw error;

        await logAudit({ action: 'update', module: 'branches', record_id: editingBranch.id, description: `Updated branch ${form.name}` });
        toast({ title: 'Branch updated', description: `${form.name} has been updated.` });
      } else {
        const { error } = await supabase
          .from('branches')
          .insert({
            church_id: profile.church_id,
            name: form.name,
            slug: `${slug}-${Date.now().toString(36)}`,
            address: form.address || null,
            phone: form.phone || null,
            email: form.email || null,
          });
        if (error) throw error;

        await logAudit({ action: 'create', module: 'branches', description: `Created branch ${form.name}` });
        toast({ title: 'Branch created', description: `${form.name} has been added.` });
      }

      setDialogOpen(false);
      setForm({ name: '', address: '', phone: '', email: '' });
      setEditingBranch(null);
      loadBranches();
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Error', description: 'Failed to save branch.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setForm({ name: branch.name, address: branch.address || '', phone: branch.phone || '', email: branch.email || '' });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingBranch(null);
    setForm({ name: '', address: '', phone: '', email: '' });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Branches" description="Manage your church branches and campuses">
        {canManage && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Branch
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : branches.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="No branches yet"
          description="Add your first church branch to get started."
          action={canManage && <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Branch</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{branch.name}</h3>
                      <Badge variant="secondary" className="mt-0.5">{memberCounts[branch.id] || 0} members</Badge>
                    </div>
                  </div>
                  {canManage && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(branch)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {branch.address && <p className="flex items-start gap-2"><MapPin className="h-4 w-4 shrink-0 mt-0.5" /> {branch.address}</p>}
                  {branch.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {branch.phone}</p>}
                  {branch.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> {branch.email}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
            <DialogDescription>{editingBranch ? 'Update branch information' : 'Create a new church branch or campus'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Accra Central" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, city" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+233 ..." />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="branch@church.org" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : editingBranch ? 'Save Changes' : 'Create Branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
