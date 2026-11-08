import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import type { Branch, Member } from '@/types';

const memberSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required'),
  gender: z.enum(['male', 'female']).optional(),
  date_of_birth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  occupation: z.string().optional(),
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed', 'separated']).optional(),
  wedding_anniversary: z.string().optional(),
  date_joined: z.string().min(1, 'Date joined is required'),
  membership_status: z.enum(['visitor', 'new_member', 'active', 'inactive', 'transferred', 'deceased']),
  baptism_status: z.enum(['not_baptized', 'baptized', 'scheduled']),
  baptism_date: z.string().optional(),
  salvation_date: z.string().optional(),
  hall_zone: z.string().optional(),
  notes: z.string().optional(),
  branch_id: z.string().min(1, 'Branch is required'),
});

type MemberFormData = z.infer<typeof memberSchema>;

export function MemberFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      membership_status: 'new_member',
      baptism_status: 'not_baptized',
      date_joined: new Date().toISOString().split('T')[0],
      branch_id: profile?.branch_id || '',
    },
  });

  useEffect(() => {
    async function loadBranches() {
      const { data } = await supabase.from('branches').select('*').eq('is_active', true);
      setBranches((data as Branch[]) || []);
    }
    loadBranches();
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    async function loadMember() {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        toast({ title: 'Error', description: 'Member not found.', variant: 'destructive' });
        navigate('/members');
        return;
      }

      const member = data as Member;
      reset({
        first_name: member.first_name,
        middle_name: member.middle_name || '',
        last_name: member.last_name,
        gender: member.gender || undefined,
        date_of_birth: member.date_of_birth || '',
        phone: member.phone || '',
        email: member.email || '',
        address: member.address || '',
        emergency_contact: member.emergency_contact || '',
        emergency_contact_phone: member.emergency_contact_phone || '',
        occupation: member.occupation || '',
        marital_status: member.marital_status || undefined,
        wedding_anniversary: member.wedding_anniversary || '',
        date_joined: member.date_joined,
        membership_status: member.membership_status,
        baptism_status: member.baptism_status,
        baptism_date: member.baptism_date || '',
        salvation_date: member.salvation_date || '',
        hall_zone: member.hall_zone || '',
        notes: member.notes || '',
        branch_id: member.branch_id,
      });
      setLoading(false);
    }
    loadMember();
  }, [id, isEdit, navigate, reset, toast]);

  const onSubmit = async (data: MemberFormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        church_id: profile?.church_id,
        middle_name: data.middle_name || null,
        gender: data.gender || null,
        date_of_birth: data.date_of_birth || null,
        email: data.email || null,
        address: data.address || null,
        emergency_contact: data.emergency_contact || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        occupation: data.occupation || null,
        marital_status: data.marital_status || null,
        wedding_anniversary: data.wedding_anniversary || null,
        baptism_date: data.baptism_date || null,
        salvation_date: data.salvation_date || null,
        hall_zone: data.hall_zone || null,
        notes: data.notes || null,
      };

      if (isEdit && id) {
        const { error } = await supabase.from('members').update(payload).eq('id', id);
        if (error) throw error;

        await logAudit({
          action: 'update',
          module: 'members',
          record_id: id,
          record_type: 'member',
          description: `Updated member ${data.first_name} ${data.last_name}`,
        });

        toast({ title: 'Member updated', description: `${data.first_name} ${data.last_name}'s profile has been updated.` });
        navigate(`/members/${id}`);
      } else {
        const memberCode = `CC-${String(Date.now()).slice(-4)}`;
        const { data: newMember, error } = await supabase
          .from('members')
          .insert({ ...payload, member_code: memberCode })
          .select('id')
          .single();

        if (error) throw error;

        await logAudit({
          action: 'create',
          module: 'members',
          record_id: newMember.id,
          record_type: 'member',
          description: `Created member ${data.first_name} ${data.last_name}`,
        });

        toast({ title: 'Member added', description: `${data.first_name} ${data.last_name} has been added to the church.` });
        navigate(`/members/${newMember.id}`);
      }
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Error', description: 'Failed to save member. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={isEdit ? 'Edit Member' : 'Add New Member'} description={isEdit ? 'Update member information' : 'Create a new church member profile'}>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="personal">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="spiritual">Spiritual</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          {/* Personal Info */}
          <TabsContent value="personal">
            <Card>
              <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name <span className="text-destructive">*</span></Label>
                  <Input {...register('first_name')} />
                  {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input {...register('middle_name')} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name <span className="text-destructive">*</span></Label>
                  <Input {...register('last_name')} />
                  {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={watch('gender') || ''} onValueChange={(v) => setValue('gender', v as 'male' | 'female')}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" {...register('date_of_birth')} />
                </div>
                <div className="space-y-2">
                  <Label>Occupation</Label>
                  <Input {...register('occupation')} placeholder="e.g., Teacher" />
                </div>
                <div className="space-y-2">
                  <Label>Marital Status</Label>
                  <Select value={watch('marital_status') || ''} onValueChange={(v) => setValue('marital_status', v as MemberFormData['marital_status'])}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="separated">Separated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Wedding Anniversary</Label>
                  <Input type="date" {...register('wedding_anniversary')} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Info */}
          <TabsContent value="contact">
            <Card>
              <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input {...register('phone')} placeholder="+233 24 000 0000" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...register('email')} placeholder="member@email.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address</Label>
                  <Input {...register('address')} placeholder="Street, area, city" />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  <Input {...register('emergency_contact')} placeholder="Contact name" />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact Phone</Label>
                  <Input {...register('emergency_contact_phone')} placeholder="+233 ..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spiritual Info */}
          <TabsContent value="spiritual">
            <Card>
              <CardHeader><CardTitle className="text-base">Spiritual Information</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Membership Status <span className="text-destructive">*</span></Label>
                  <Select value={watch('membership_status')} onValueChange={(v) => setValue('membership_status', v as MemberFormData['membership_status'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visitor">Visitor</SelectItem>
                      <SelectItem value="new_member">New Member</SelectItem>
                      <SelectItem value="active">Active Member</SelectItem>
                      <SelectItem value="inactive">Inactive Member</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="deceased">Deceased</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Baptism Status</Label>
                  <Select value={watch('baptism_status')} onValueChange={(v) => setValue('baptism_status', v as MemberFormData['baptism_status'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_baptized">Not Baptized</SelectItem>
                      <SelectItem value="baptized">Baptized</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Joined <span className="text-destructive">*</span></Label>
                  <Input type="date" {...register('date_joined')} />
                  {errors.date_joined && <p className="text-xs text-destructive">{errors.date_joined.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Salvation Date</Label>
                  <Input type="date" {...register('salvation_date')} />
                </div>
                <div className="space-y-2">
                  <Label>Baptism Date</Label>
                  <Input type="date" {...register('baptism_date')} />
                </div>
                <div className="space-y-2">
                  <Label>Hall / Zone / Group</Label>
                  <Input {...register('hall_zone')} placeholder="e.g., Zone A" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other */}
          <TabsContent value="other">
            <Card>
              <CardHeader><CardTitle className="text-base">Additional Information</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-2">
                  <Label>Branch <span className="text-destructive">*</span></Label>
                  <Select value={watch('branch_id')} onValueChange={(v) => setValue('branch_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.branch_id && <p className="text-xs text-destructive">{errors.branch_id.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea {...register('notes')} placeholder="Any additional notes about this member..." rows={4} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> {isEdit ? 'Save Changes' : 'Add Member'}</>
              )}
            </Button>
          </div>
        </Tabs>
      </form>
    </div>
  );
}
