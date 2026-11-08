import { useState, useEffect } from 'react';
import { Settings, Church as ChurchIcon, Users, Shield, Bell, Palette } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoleBadge } from '@/components/status-badges';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { hasPermission } from '@/lib/permissions';
import { getInitials } from '@/lib/format';
import { ROLE_LABELS, type Church, type Profile, type UserRole } from '@/types';

export function SettingsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const canManageSettings = hasPermission(profile?.role, 'settings.manage');
  const canManageUsers = hasPermission(profile?.role, 'users.manage');

  const [church, setChurch] = useState<Church | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [churchForm, setChurchForm] = useState({ name: '', address: '', phone: '', email: '' });

  useEffect(() => {
    async function loadData() {
      if (profile?.church_id) {
        const { data: churchData } = await supabase
          .from('churches')
          .select('*')
          .eq('id', profile.church_id)
          .maybeSingle();
        if (churchData) {
          setChurch(churchData as Church);
          setChurchForm({
            name: (churchData as Church).name || '',
            address: (churchData as Church).address || '',
            phone: (churchData as Church).phone || '',
            email: (churchData as Church).email || '',
          });
        }
      }
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers((usersData as Profile[]) || []);
      setLoading(false);
    }
    loadData();
  }, [profile?.church_id]);

  const handleSaveChurch = async () => {
    if (!church) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('churches')
        .update({
          name: churchForm.name,
          address: churchForm.address || null,
          phone: churchForm.phone || null,
          email: churchForm.email || null,
        })
        .eq('id', church.id);
      if (error) throw error;
      toast({ title: 'Church profile updated', description: 'Your church information has been saved.' });
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Error', description: 'Failed to update church profile.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      setUsers(users.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: 'Role updated', description: `User role changed to ${ROLE_LABELS[newRole]}.` });
    } catch (err) {
      console.error('Role update error:', err);
      toast({ title: 'Error', description: 'Failed to update role.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your church and system configuration" />

      <Tabs defaultValue="church">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
          <TabsTrigger value="church"><ChurchIcon className="mr-2 h-4 w-4 inline" />Church</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4 inline" />Users</TabsTrigger>
          <TabsTrigger value="roles"><Shield className="mr-2 h-4 w-4 inline" />Roles</TabsTrigger>
          <TabsTrigger value="system"><Settings className="mr-2 h-4 w-4 inline" />System</TabsTrigger>
        </TabsList>

        {/* Church Profile */}
        <TabsContent value="church">
          <Card>
            <CardHeader><CardTitle className="text-base">Church Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                      <ChurchIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{church?.name}</p>
                      <p className="text-sm text-muted-foreground">Established {church?.founded_date}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Church Name</Label>
                      <Input value={churchForm.name} onChange={(e) => setChurchForm({ ...churchForm, name: e.target.value })} disabled={!canManageSettings} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={churchForm.phone} onChange={(e) => setChurchForm({ ...churchForm, phone: e.target.value })} disabled={!canManageSettings} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={churchForm.email} onChange={(e) => setChurchForm({ ...churchForm, email: e.target.value })} disabled={!canManageSettings} />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={churchForm.address} onChange={(e) => setChurchForm({ ...churchForm, address: e.target.value })} disabled={!canManageSettings} />
                    </div>
                  </div>
                  {canManageSettings && (
                    <Button onClick={handleSaveChurch} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">System Users</CardTitle>
                <span className="text-sm text-muted-foreground">{users.length} users</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      {canManageUsers && <TableHead className="pr-6 text-right">Change Role</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {getInitials(user.first_name, user.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                              <p className="text-xs text-muted-foreground">{user.phone || 'No phone'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><RoleBadge role={user.role} /></TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${user.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        {canManageUsers && (
                          <TableCell className="pr-6 text-right">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                              className="rounded-md border border-input bg-transparent px-2 py-1 text-xs"
                            >
                              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions */}
        <TabsContent value="roles">
          <Card>
            <CardHeader><CardTitle className="text-base">Roles & Permissions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Your current role: <RoleBadge role={profile?.role || 'member'} className="ml-1" /></p>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Role</TableHead>
                        <TableHead>Key Permissions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(ROLE_LABELS).map(([role, label]) => (
                        <TableRow key={role}>
                          <TableCell className="pl-4"><RoleBadge role={role} /></TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {role === 'super_admin' && 'Full system access, manage all users and settings'}
                            {role === 'pastor' && 'View all data, manage follow-ups, pastoral care'}
                            {role === 'church_admin' && 'Manage members, branches, events, users'}
                            {role === 'accountant' && 'Finance, giving, expenses, financial reports'}
                            {role === 'ministry_leader' && 'Manage own ministry, attendance, events'}
                            {role === 'staff' && 'Manage members, attendance, view branches'}
                            {role === 'volunteer' && 'View members, record attendance'}
                            {role === 'member' && 'View own profile and church info'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System */}
        <TabsContent value="system">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Notification preferences will be available in a future update. You'll be able to configure email, SMS, and in-app notification settings.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> Appearance</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Custom branding and theme colors will be configurable in a future update to match your church's brand identity.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
