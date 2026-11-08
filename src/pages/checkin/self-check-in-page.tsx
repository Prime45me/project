import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, Loader2, UserPlus, LogIn, Church, CalendarDays,
  Users, AlertCircle, ArrowRight, RefreshCw, QrCode,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { SESSION_TYPE_LABELS } from '@/types';

type CheckInState = 'loading' | 'ready' | 'checking_in' | 'success' | 'already' | 'error' | 'no_session';

interface SessionInfo {
  id: string;
  title: string;
  session_type: string;
  session_date: string;
  total_attendance: number;
  church_name: string;
  branch_name: string;
}

export function SelfCheckInPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const { user, profile, loading: authLoading } = useAuth();

  const [state, setState] = useState<CheckInState>('loading');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [memberName, setMemberName] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [liveCount, setLiveCount] = useState(0);
  const [hasMember, setHasMember] = useState(false);
  const [autoLinked, setAutoLinked] = useState(false);

  // Visitor form
  const [visitorForm, setVisitorForm] = useState({ first_name: '', last_name: '', phone: '' });

  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setState('no_session');
      return;
    }
    const { data, error } = await supabase.rpc('get_check_in_session', { p_session_id: sessionId });
    if (error || !data || (data as { error?: string }).error) {
      setState('no_session');
      return;
    }
    const s = data as SessionInfo;
    setSession(s);
    setLiveCount(s.total_attendance);
  }, [sessionId]);

  const checkStatus = useCallback(async () => {
    if (!user) {
      setState('ready');
      return;
    }
    const { data } = await supabase.rpc('check_in_status', { p_session_id: sessionId });
    if (!data) {
      setState('ready');
      return;
    }
    const result = data as {
      authenticated: boolean;
      has_member?: boolean;
      checked_in?: boolean;
      name?: string;
      check_in_time?: string;
    };

    if (result.checked_in) {
      setMemberName(result.name || '');
      setCheckInTime(result.check_in_time || '');
      setState('already');
    } else if (result.has_member) {
      setMemberName(result.name || '');
      setState('ready');
    } else {
      // No linked member — try auto-linking
      const { data: linkData } = await supabase.rpc('auto_link_member');
      if (linkData && (linkData as { linked?: boolean }).linked) {
        const linkResult = linkData as { linked: boolean; auto: boolean; name: string };
        setAutoLinked(linkResult.auto);
        setMemberName(linkResult.name);
        setHasMember(true);
        setState('ready');
      } else {
        setHasMember(false);
        setState('ready');
      }
    }
  }, [user, sessionId]);

  useEffect(() => {
    (async () => {
      await loadSession();
      if (sessionId) await checkStatus();
    })();
  }, [loadSession, checkStatus, sessionId]);

  // Live count polling
  useEffect(() => {
    if (!sessionId || state === 'no_session') return;
    pollInterval.current = setInterval(async () => {
      const { data } = await supabase.rpc('get_check_in_session', { p_session_id: sessionId });
      if (data && !(data as { error?: string }).error) {
        setLiveCount((data as SessionInfo).total_attendance);
      }
    }, 5000);
    return () => { if (pollInterval.current) clearInterval(pollInterval.current); };
  }, [sessionId, state]);

  const handleMemberCheckIn = async () => {
    if (!sessionId) return;
    setState('checking_in');
    const { data, error } = await supabase.rpc('self_check_in', { p_session_id: sessionId });
    if (error) {
      setErrorMsg('Something went wrong. Please try again.');
      setState('error');
      return;
    }
    const result = data as { success?: boolean; error?: string; name?: string };
    if (result.success) {
      setMemberName(result.name || '');
      setLiveCount(prev => prev + 1);
      setState('success');
    } else if (result.error === 'already_checked_in') {
      setMemberName(result.name || '');
      setState('already');
    } else if (result.error === 'no_linked_member') {
      setHasMember(false);
      setState('ready');
    } else {
      setErrorMsg(result.error || 'Check-in failed');
      setState('error');
    }
  };

  const handleVisitorCheckIn = async () => {
    if (!sessionId || !visitorForm.first_name.trim() || !visitorForm.last_name.trim()) return;
    setState('checking_in');
    const { data, error } = await supabase.rpc('visitor_check_in', {
      p_session_id: sessionId,
      p_first_name: visitorForm.first_name.trim(),
      p_last_name: visitorForm.last_name.trim(),
      p_phone: visitorForm.phone.trim() || null,
    });
    if (error) {
      setErrorMsg('Something went wrong. Please try again.');
      setState('error');
      return;
    }
    const result = data as { success?: boolean; error?: string; name?: string };
    if (result.success) {
      setMemberName(result.name || '');
      setLiveCount(prev => prev + 1);
      setState('success');
    } else {
      setErrorMsg(result.error || 'Check-in failed');
      setState('error');
    }
  };

  const checkingIn = state === 'checking_in';

  if (state === 'loading' || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Loading check-in...</p>
        </div>
      </div>
    );
  }

  if (state === 'no_session') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">No Session Found</h1>
            <p className="mt-2 text-sm text-slate-500">
              This check-in link is invalid or has expired. Please scan the QR code at the entrance again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-primary py-6 px-4 text-center text-white">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Church className="h-5 w-5" />
          <span className="text-sm font-medium opacity-90">{session?.church_name}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{session?.title}</h1>
        <div className="mt-1.5 flex items-center justify-center gap-3 text-sm opacity-80">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {session ? new Date(session.session_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {liveCount} checked in
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {/* Success State */}
        {state === 'success' && (
          <Card className="border-emerald-200 shadow-lg animate-in fade-in zoom-in duration-300">
            <CardContent className="pt-10 pb-10 text-center">
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 animate-in zoom-in duration-500">
                <CheckCircle2 className="h-14 w-14 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">You're Checked In!</h2>
              <p className="mt-2 text-lg text-slate-700">{memberName}</p>
              <p className="mt-1 text-sm text-slate-500">Welcome to {session?.title}. See you inside!</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                <Users className="h-4 w-4" />
                {liveCount} people checked in so far
              </div>
            </CardContent>
          </Card>
        )}

        {/* Already Checked In State */}
        {state === 'already' && (
          <Card className="border-blue-200 shadow-lg">
            <CardContent className="pt-10 pb-10 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle2 className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Already Checked In</h2>
              <p className="mt-2 text-base text-slate-700">{memberName}</p>
              <p className="mt-1 text-sm text-slate-500">
                You checked in at {checkInTime ? new Date(checkInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'earlier'}
              </p>
              <p className="mt-4 text-sm text-slate-400">No need to check in again. Enjoy the service!</p>
            </CardContent>
          </Card>
        )}

        {/* Ready State — Logged in with linked member */}
        {state === 'ready' && user && hasMember && (
          <Card className="shadow-lg">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Welcome, {memberName.split(' ')[0]}!</h2>
              {autoLinked && (
                <p className="mt-1 text-xs text-emerald-600">Your account was linked automatically</p>
              )}
              <p className="mt-3 text-sm text-slate-500">
                Tap below to check in for this session.
              </p>
              <Button
                size="lg"
                className="w-full mt-6 text-base h-12"
                onClick={handleMemberCheckIn}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Check Me In
              </Button>
              <p className="mt-3 text-xs text-slate-400">
                {liveCount} people already checked in
              </p>
            </CardContent>
          </Card>
        )}

        {/* Ready State — Logged in but no linked member */}
        {state === 'ready' && user && !hasMember && (
          <div className="space-y-4">
            <Card className="shadow-lg">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <UserPlus className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Welcome, {profile?.first_name || 'Friend'}!</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Your account isn't linked to a member record yet. You can check in as a visitor below, or contact your church admin to link your account.
                </p>
              </CardContent>
            </Card>

            <VisitorForm
              form={visitorForm}
              setForm={setVisitorForm}
              onSubmit={handleVisitorCheckIn}
              checkingIn={checkingIn}
              prefillName={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
            />
          </div>
        )}

        {/* Ready State — Not logged in */}
        {state === 'ready' && !user && (
          <div className="space-y-4">
            <Card className="shadow-lg">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Welcome!</h2>
                <p className="mt-2 text-sm text-slate-500">
                  If you're a member, sign in for one-tap check-in. If you're visiting, just fill in your name below.
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-5"
                  onClick={() => { window.location.href = `/login?redirect=/checkin?session=${sessionId}`; }}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In for Quick Check-in
                </Button>
              </CardContent>
            </Card>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs font-medium text-slate-400">Or check in as a visitor</span>
              </div>
            </div>

            <VisitorForm
              form={visitorForm}
              setForm={setVisitorForm}
              onSubmit={handleVisitorCheckIn}
              checkingIn={checkingIn}
            />
          </div>
        )}

        {/* Checking In State */}
        {state === 'checking_in' && (
          <Card className="shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700">Checking you in...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {state === 'error' && (
          <Card className="border-red-200 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Check-in Failed</h2>
              <p className="mt-2 text-sm text-slate-500">{errorMsg}</p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => setState(user ? (hasMember ? 'ready' : 'ready') : 'ready')}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-slate-400">
        {session?.church_name} · {SESSION_TYPE_LABELS[session?.session_type as keyof typeof SESSION_TYPE_LABELS] || 'Service'}
      </div>
    </div>
  );
}

function VisitorForm({
  form, setForm, onSubmit, checkingIn, prefillName,
}: {
  form: { first_name: string; last_name: string; phone: string };
  setForm: (f: { first_name: string; last_name: string; phone: string }) => void;
  onSubmit: () => void;
  checkingIn: boolean;
  prefillName?: string;
}) {
  // Prefill if provided and fields are empty
  useEffect(() => {
    if (prefillName && !form.first_name) {
      const parts = prefillName.split(' ');
      setForm({
        first_name: parts[0] || '',
        last_name: parts.slice(1).join(' ') || '',
        phone: form.phone,
      });
    }
  }, [prefillName]);

  return (
    <Card className="shadow-lg">
      <CardContent className="pt-6 pb-6">
        <h3 className="text-base font-semibold text-slate-900 mb-1">Visitor Check-in</h3>
        <p className="text-xs text-slate-500 mb-4">Just 3 quick fields</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">First Name</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="John"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Last Name</Label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Doe"
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phone <span className="text-slate-400">(optional)</span></Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="024 000 0000"
              className="h-11"
            />
          </div>
          <Button
            size="lg"
            className="w-full h-12 text-base"
            onClick={onSubmit}
            disabled={checkingIn || !form.first_name.trim() || !form.last_name.trim()}
          >
            {checkingIn ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking in...</>
            ) : (
              <>Check In <ArrowRight className="ml-2 h-5 w-5" /></>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
