import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Phone, Mail, MapPin, Calendar, Briefcase,
  Heart, Droplets, Users, FileText, Home, User as UserIcon, Loader2, Church
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { MemberStatusBadge, RoleBadge } from '@/components/status-badges';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/permissions';
import { formatDate, calculateAge, getInitials, getGenderLabel, getMaritalStatusLabel, getBaptismStatusLabel } from '@/lib/format';
import type { Member, Family, FamilyMember } from '@/types';

export function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const canManage = hasPermission(profile?.role, 'members.manage');

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [families, setFamilies] = useState<FamilyMember[]>([]);
  const [activity, setActivity] = useState<{ label: string; date: string; icon: string }[]>([]);

  useEffect(() => {
    if (!id) return;
    async function loadMember() {
      const { data, error } = await supabase
        .from('members')
        .select('*, branch:branches(*)')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        navigate('/members');
        return;
      }
      setMember(data as Member);

      // Load family membership
      const { data: fmData } = await supabase
        .from('family_members')
        .select('*, family:families(*), member:members(*)')
        .eq('member_id', id);

      setFamilies((fmData as FamilyMember[]) || []);

      // Build activity timeline
      const activities: { label: string; date: string; icon: string }[] = [];
      if (data.date_joined) activities.push({ label: 'Joined the church', date: data.date_joined, icon: 'church' });
      if (data.salvation_date) activities.push({ label: 'Gave life to Christ', date: data.salvation_date, icon: 'heart' });
      if (data.baptism_date) activities.push({ label: 'Was baptized', date: data.baptism_date, icon: 'droplets' });
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivity(activities);

      setLoading(false);
    }
    loadMember();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) return null;

  const fullName = `${member.first_name} ${member.middle_name ? member.middle_name + ' ' : ''}${member.last_name}`;

  return (
    <div className="space-y-6">
      <PageHeader title={fullName} description={member.member_code || 'No member code'}>
        <Button variant="outline" size="sm" onClick={() => navigate('/members')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {canManage && (
          <Button size="sm" onClick={() => navigate(`/members/${member.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </PageHeader>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials(member.first_name, member.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{fullName}</h2>
                <MemberStatusBadge status={member.membership_status} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {member.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {member.phone}</span>}
                {member.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {member.email}</span>}
                {member.occupation && <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {member.occupation}</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                {member.branch?.name || 'No branch'} · Joined {formatDate(member.date_joined)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="ministries">Ministries</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Full Name" value={fullName} />
                <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Gender" value={member.gender ? getGenderLabel(member.gender) : '—'} />
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={member.date_of_birth ? `${formatDate(member.date_of_birth)} (${calculateAge(member.date_of_birth)} years)` : '—'} />
                <InfoRow icon={<Heart className="h-4 w-4" />} label="Marital Status" value={member.marital_status ? getMaritalStatusLabel(member.marital_status) : '—'} />
                {member.wedding_anniversary && <InfoRow icon={<Heart className="h-4 w-4" />} label="Anniversary" value={formatDate(member.wedding_anniversary)} />}
                <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Occupation" value={member.occupation || '—'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Contact & Emergency</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={member.phone || '—'} />
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={member.email || '—'} />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={member.address || '—'} />
                <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Emergency Contact" value={member.emergency_contact || '—'} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Emergency Phone" value={member.emergency_contact_phone || '—'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Spiritual Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={<Church className="h-4 w-4" />} label="Date Joined" value={formatDate(member.date_joined)} />
                <InfoRow icon={<Droplets className="h-4 w-4" />} label="Baptism" value={getBaptismStatusLabel(member.baptism_status)} />
                {member.baptism_date && <InfoRow icon={<Calendar className="h-4 w-4" />} label="Baptism Date" value={formatDate(member.baptism_date)} />}
                {member.salvation_date && <InfoRow icon={<Heart className="h-4 w-4" />} label="Salvation Date" value={formatDate(member.salvation_date)} />}
                <InfoRow icon={<Home className="h-4 w-4" />} label="Hall / Zone" value={member.hall_zone || '—'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Membership</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Member Code" value={member.member_code || '—'} />
                <InfoRow icon={<Church className="h-4 w-4" />} label="Branch" value={member.branch?.name || '—'} />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><UserIcon className="h-4 w-4" /> Status</span>
                  <MemberStatusBadge status={member.membership_status} />
                </div>
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Created" value={formatDate(member.created_at)} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Family */}
        <TabsContent value="family">
          <Card>
            <CardHeader><CardTitle className="text-base">Family Membership</CardTitle></CardHeader>
            <CardContent>
              {families.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-8 w-8" />}
                  title="Not in a family"
                  description="This member is not currently linked to any family."
                />
              ) : (
                <div className="space-y-3">
                  {families.map((fm) => (
                    <div key={fm.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{fm.family?.family_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {fm.is_head ? 'Head of Family' : fm.relationship || 'Member'}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/families')}>
                        View Family
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Timeline */}
        <TabsContent value="activity">
          <Card>
            <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="h-8 w-8" />}
                  title="No activity recorded"
                  description="This member's activity will appear here as it's recorded."
                />
              ) : (
                <div className="relative space-y-6 before:absolute before:left-3 before:top-2 before:h-full before:w-px before:bg-border">
                  {activity.map((event, i) => (
                    <div key={i} className="relative flex gap-4">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background z-10">
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm font-medium">{event.label}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ministries */}
        <TabsContent value="ministries">
          <Card>
            <CardHeader><CardTitle className="text-base">Ministry Memberships</CardTitle></CardHeader>
            <CardContent>
              <EmptyState
                icon={<Church className="h-8 w-8" />}
                title="No ministries joined"
                description="This member has not been assigned to any ministries yet. Ministry management is coming in Phase 2."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes">
          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent>
              {member.notes ? (
                <p className="text-sm whitespace-pre-wrap text-foreground">{member.notes}</p>
              ) : (
                <EmptyState
                  icon={<FileText className="h-8 w-8" />}
                  title="No notes"
                  description="There are no notes recorded for this member."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">{icon} {label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
