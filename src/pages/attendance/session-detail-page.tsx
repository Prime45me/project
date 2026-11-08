import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, QrCode, CheckCircle2, XCircle, Clock,
  Loader2, UserPlus, Check, X,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { getInitials, formatDate } from '@/lib/format';
import { SESSION_TYPE_LABELS, type AttendanceSession, type Member, type AttendanceRecord } from '@/types';

interface PresentMember {
  id: string;
  session_id: string;
  member_id: string;
  status: string;
  check_in_method: string | null;
  check_in_time: string | null;
  created_at: string;
  member?: { first_name: string; last_name: string; member_code: string | null; phone: string | null } | { first_name: string; last_name: string; member_code: string | null; phone: string | null }[];
}

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [presentRecords, setPresentRecords] = useState<PresentMember[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [markingId, setMarkingId] = useState<string | null>(null);

  const presentMemberIds = new Set(presentRecords.map(r => r.member_id));
  const absentMembers = allMembers.filter(m => !presentMemberIds.has(m.id));

  const loadData = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);

    const [sessionRes, recordsRes, membersRes] = await Promise.all([
      supabase.from('attendance_sessions').select('*').eq('id', sessionId).maybeSingle(),
      supabase
        .from('attendance_records')
        .select('id, session_id, member_id, status, check_in_method, check_in_time, created_at, member:members(first_name, last_name, member_code, phone)')
        .eq('session_id', sessionId)
        .order('check_in_time', { ascending: false, nullsFirst: false }),
      supabase
        .from('members')
        .select('id, first_name, last_name, member_code, phone, is_archived')
        .eq('is_archived', false)
        .order('first_name'),
    ]);

    if (sessionRes.data) setSession(sessionRes.data as AttendanceSession);
    if (recordsRes.data) setPresentRecords(recordsRes.data as unknown as PresentMember[]);
    if (membersRes.data) setAllMembers(membersRes.data as Member[]);

    setLoading(false);
  }, [sessionId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleMarkPresent = async (member: Member) => {
    if (!sessionId) return;
    setMarkingId(member.id);
    try {
      const { error } = await supabase.from('attendance_records').upsert({
        session_id: sessionId,
        member_id: member.id,
        status: 'present',
        check_in_method: 'manual',
        check_in_time: new Date().toISOString(),
      }, { onConflict: 'session_id,member_id' });

      if (error) throw error;

      // Increment session total
      if (session && !presentMemberIds.has(member.id)) {
        await supabase.from('attendance_sessions')
          .update({ total_attendance: session.total_attendance + 1 })
          .eq('id', sessionId);
      }

      toast({ title: 'Marked present', description: `${member.first_name} ${member.last_name} has been marked present.` });
      loadData();
    } catch (err) {
      console.error('Mark present error:', err);
      toast({ title: 'Error', description: 'Failed to mark member present.', variant: 'destructive' });
    } finally {
      setMarkingId(null);
    }
  };

  const handleRemoveCheckIn = async (record: PresentMember) => {
    if (!sessionId) return;
    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      if (session) {
        await supabase.from('attendance_sessions')
          .update({ total_attendance: Math.max(0, session.total_attendance - 1) })
          .eq('id', sessionId);
      }

      toast({ title: 'Removed', description: `Check-in removed for ${getMember(record.member)?.first_name || 'member'}.` });
      loadData();
    } catch (err) {
      console.error('Remove error:', err);
      toast({ title: 'Error', description: 'Failed to remove check-in.', variant: 'destructive' });
    }
  };

  const filteredAbsent = absentMembers.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.first_name.toLowerCase().includes(q) ||
      m.last_name.toLowerCase().includes(q) ||
      (m.member_code || '').toLowerCase().includes(q) ||
      (m.phone || '').includes(q)
    );
  });

  const filteredPresent = presentRecords.filter(r => {
    if (!searchQuery.trim()) return true;
    const mem = getMember(r.member);
    const name = mem ? `${mem.first_name} ${mem.last_name}` : '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const qrCheckedIn = presentRecords.filter(r => r.check_in_method === 'qr').length;
  const manualCheckedIn = presentRecords.filter(r => r.check_in_method === 'manual' || r.check_in_method === 'search').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<XCircle className="h-8 w-8" />}
          title="Session not found"
          description="This attendance session doesn't exist or has been deleted."
          action={<Button onClick={() => navigate('/attendance')}>Back to Attendance</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/attendance')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <PageHeader
        title={session.title}
        description={`${SESSION_TYPE_LABELS[session.session_type]} · ${formatDate(session.session_date)}`}
      >
        <Button size="sm" onClick={() => navigate(`/attendance/${session.id}/qr-display`)}>
          <QrCode className="mr-2 h-4 w-4" />
          Display QR Code
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
              <div><p className="text-sm text-muted-foreground">Present</p><p className="text-2xl font-bold">{presentRecords.length}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600"><XCircle className="h-5 w-5" /></div>
              <div><p className="text-sm text-muted-foreground">Absent</p><p className="text-2xl font-bold">{absentMembers.length}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><QrCode className="h-5 w-5" /></div>
              <div><p className="text-sm text-muted-foreground">QR Check-ins</p><p className="text-2xl font-bold">{qrCheckedIn}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><UserPlus className="h-5 w-5" /></div>
              <div><p className="text-sm text-muted-foreground">Manual</p><p className="text-2xl font-bold">{manualCheckedIn}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Search members by name, code, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabs: Present / Absent */}
      <Tabs defaultValue="present">
        <TabsList>
          <TabsTrigger value="present" className="gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Present ({presentRecords.length})
          </TabsTrigger>
          <TabsTrigger value="absent" className="gap-1.5">
            <XCircle className="h-4 w-4 text-red-500" />
            Absent ({absentMembers.length})
          </TabsTrigger>
        </TabsList>

        {/* Present Tab */}
        <TabsContent value="present">
          <Card>
            <CardContent className="p-0">
              {filteredPresent.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-8 w-8" />}
                  title={searchQuery ? "No matching members found" : "No one checked in yet"}
                  description={searchQuery ? "Try a different search term." : "Members will appear here as they scan the QR code or get manually checked in."}
                />
              ) : (
                <PresentTable rows={filteredPresent} onRemove={handleRemoveCheckIn} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Absent Tab */}
        <TabsContent value="absent">
          <Card>
            <CardContent className="p-0">
              {filteredAbsent.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-8 w-8" />}
                  title={searchQuery ? "No matching members found" : "Everyone is checked in!"}
                  description={searchQuery ? "Try a different search term." : "All members have been marked present for this session."}
                />
              ) : (
                <div className="divide-y">
                  {filteredAbsent.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold shrink-0">
                          {getInitials(m.first_name, m.last_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.first_name} {m.last_name}</p>
                          <p className="text-xs text-muted-foreground">{m.member_code || m.phone || '—'}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={markingId === m.id}
                        onClick={() => handleMarkPresent(m)}
                      >
                        {markingId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="mr-1.5 h-4 w-4" />
                            Mark Present
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getMember(m: PresentMember['member']): { first_name: string; last_name: string; member_code: string | null; phone: string | null } | null {
  if (!m) return null;
  if (Array.isArray(m)) return m[0] || null;
  return m;
}

function PresentTable({ rows, onRemove }: { rows: PresentMember[]; onRemove: (r: PresentMember) => void }) {
  return (
    <div className="divide-y">
      {rows.map((r) => {
        const mem = getMember(r.member);
        const name = mem ? `${mem.first_name} ${mem.last_name}` : 'Unknown';
        const code = mem?.member_code || mem?.phone || '—';
        return (
          <div key={r.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold shrink-0">
                {mem ? getInitials(mem.first_name, mem.last_name) : '??'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{code}</span>
                  {r.check_in_method === 'qr' && (
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 gap-0.5">
                      <QrCode className="h-3 w-3" /> QR
                    </Badge>
                  )}
                  {(r.check_in_method === 'manual' || r.check_in_method === 'search') && (
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 gap-0.5">
                      <UserPlus className="h-3 w-3" /> Manual
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {r.check_in_time && (
                <span className="text-xs text-muted-foreground tabular-nums hidden sm:flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(r.check_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => onRemove(r)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
