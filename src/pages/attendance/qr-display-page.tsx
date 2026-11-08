import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  X, Maximize, Minimize, Users, CalendarDays, QrCode, Loader2, Download,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { SESSION_TYPE_LABELS, type AttendanceSession } from '@/types';

export function QrDisplayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<{ name: string; time: string }[]>([]);

  const checkInUrl = `${window.location.origin}/checkin?session=${sessionId}`;

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (error || !data) {
      setLoading(false);
      return;
    }
    setSession(data as AttendanceSession);
    setCount((data as AttendanceSession).total_attendance);
    setLoading(false);
  }, [sessionId]);

  // Generate QR code on canvas
  useEffect(() => {
    if (!canvasRef.current || loading) return;
    QRCode.toCanvas(canvasRef.current, checkInUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }, (err) => {
      if (err) console.error('QR generation error:', err);
    });
  }, [checkInUrl, loading]);

  // Initial load
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Live polling for count + recent check-ins
  useEffect(() => {
    if (!sessionId || loading) return;

    const poll = async () => {
      const { data: sData } = await supabase
        .from('attendance_sessions')
        .select('total_attendance')
        .eq('id', sessionId)
        .maybeSingle();
      if (sData) {
        const newCount = (sData as AttendanceSession).total_attendance;
        setCount(newCount);
      }

      // Get recent check-ins (last 5)
      const { data: recs } = await supabase
        .from('attendance_records')
        .select('member_id, check_in_time, member:members(first_name, last_name)')
        .eq('session_id', sessionId)
        .order('check_in_time', { ascending: false, nullsFirst: false })
        .limit(5);
      if (recs) {
        const recent = recs.map((r) => {
          const m = r.member as unknown as { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
          const member = Array.isArray(m) ? m[0] : m;
          return {
            name: member ? `${member.first_name} ${member.last_name}` : 'Unknown',
            time: r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
          };
        });
        setRecentCheckIns(recent);
      }
    };

    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [sessionId, loading]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `checkin-qr-${session?.title?.replace(/\s+/g, '-').toLowerCase() || 'session'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">Session not found</p>
          <Button variant="outline" className="mt-4 text-black" onClick={() => navigate('/attendance')}>
            Back to Attendance
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{session.title}</p>
            <p className="text-xs text-slate-400">
              {SESSION_TYPE_LABELS[session.session_type]} · {new Date(session.session_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDownload} className="text-white hover:bg-white/10">
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/10">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/attendance')} className="text-white hover:bg-white/10">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Display */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 p-6 lg:p-12">
        {/* QR Code */}
        <div className="flex flex-col items-center">
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <canvas ref={canvasRef} className="rounded-xl" />
          </div>
          <p className="mt-4 text-center text-sm text-slate-300 max-w-xs">
            Scan this code with your phone camera to check in
          </p>
        </div>

        {/* Live Stats */}
        <div className="flex flex-col gap-6 w-full max-w-sm">
          {/* Live Counter */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-2">
              <Users className="h-4 w-4" />
              <span>Live Check-ins</span>
            </div>
            <p className="text-6xl font-bold tabular-nums text-white">
              {count}
            </p>
            <p className="text-xs text-slate-400 mt-2">people checked in</p>
          </div>

          {/* Recent Check-ins */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-sm font-semibold text-slate-300 mb-3">Recent Check-ins</p>
            {recentCheckIns.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">Waiting for first check-in...</p>
            ) : (
              <div className="space-y-2.5">
                {recentCheckIns.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">
                        {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm text-white truncate">{c.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums shrink-0">{c.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Church Info */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-xs text-slate-400">Scan to check in</p>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(session.session_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
