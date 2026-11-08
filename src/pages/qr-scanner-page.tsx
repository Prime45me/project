import { useState, useEffect } from 'react';
import { ScanLine, Search, CheckCircle2, UserPlus, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/format';
import { SESSION_TYPE_LABELS, type Member, type SessionType, type AttendanceSession } from '@/types';

export function QrScannerPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [checkedIn, setCheckedIn] = useState<{ name: string; time: string }[]>([]);

  // Load recent sessions on mount
  useEffect(() => {
    supabase.from('attendance_sessions').select('*').order('session_date', { ascending: false }).limit(5)
      .then(({ data }) => {
        if (data) {
          setSessions(data as AttendanceSession[]);
          if (data.length > 0) setSelectedSession((data[0] as AttendanceSession).id);
        }
      });
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('is_archived', false)
      .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,member_code.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
      .limit(10);
    setSearchResults((data as Member[]) || []);
    setSearching(false);
  };

  const handleCheckIn = async (member: Member) => {
    if (!selectedSession) {
      toast({ title: 'Select a session', description: 'Please choose an attendance session first.', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('attendance_records').upsert({
        session_id: selectedSession,
        member_id: member.id,
        status: 'present',
        check_in_method: 'search',
        check_in_time: new Date().toISOString(),
      }, { onConflict: 'session_id,member_id' });

      if (error) throw error;

      // Update session total
      const session = sessions.find(s => s.id === selectedSession);
      if (session) {
        await supabase.from('attendance_sessions')
          .update({ total_attendance: session.total_attendance + 1 })
          .eq('id', selectedSession);
      }

      const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setCheckedIn(prev => [{ name: `${member.first_name} ${member.last_name}`, time }, ...prev]);
      setSearchQuery('');
      setSearchResults([]);
      toast({ title: 'Checked in', description: `${member.first_name} ${member.last_name} has been marked present.` });
    } catch (err) {
      console.error('Check-in error:', err);
      toast({ title: 'Error', description: 'Failed to check in member.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="QR Attendance Scanner" description="Check in members for attendance using search or member ID" />

      {/* Session selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Label className="mb-1.5 block">Attendance Session</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger><SelectValue placeholder="Select a session" /></SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.title} · {s.session_type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSession && (
              <div className="flex items-end">
                <Badge variant="secondary" className="text-xs">{checkedIn.length} checked in</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search & Check-in */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ScanLine className="h-5 w-5 text-primary" />Member Check-in</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search by name, code, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                          {getInitials(m.first_name, m.last_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.first_name} {m.last_name}</p>
                          <p className="text-xs text-muted-foreground">{m.member_code || m.phone || '—'}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleCheckIn(m)}>
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />Check In
                      </Button>
                    </div>
                  ))}
                </div>
              ) : searchQuery && !searching ? (
                <EmptyState icon={<UserPlus className="h-8 w-8" />} title="No members found" description="Try a different search term." />
              ) : !searchQuery ? (
                <div className="py-8 text-center">
                  <ScanLine className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Search for a member to check them in</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Recent Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            {checkedIn.length === 0 ? (
              <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} title="No check-ins yet" description="Checked-in members will appear here." />
            ) : (
              <div className="space-y-2">
                {checkedIn.map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="text-sm font-medium">{c.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.time}</span>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setCheckedIn([])}>
                  <X className="mr-2 h-4 w-4" />Clear List
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
