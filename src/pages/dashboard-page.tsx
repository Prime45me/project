import { useState, useEffect } from 'react';
import { Users, UserPlus, CalendarCheck, HandHeart, Bell, Church, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { formatDate } from '@/lib/format';
import { MemberStatusBadge } from '@/components/status-badges';
import type { Member } from '@/types';

const PIE_COLORS = ['hsl(174 55% 41%)', 'hsl(210 70% 50%)', 'hsl(43 74% 66%)', 'hsl(0 72% 51%)', 'hsl(280 65% 60%)'];

export function DashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    newMembersThisMonth: 0,
    visitors: 0,
    activeMembers: 0,
    totalBranches: 0,
    pendingFollowups: 0,
    newVisitors: 0,
    lastSundayAttendance: 0,
  });
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [branchFilter, setBranchFilter] = useState<string>('all');

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        let memberQuery = supabase
          .from('members')
          .select('id, first_name, last_name, membership_status, date_joined, branch_id, email, phone', { count: 'exact' })
          .eq('is_archived', false);

        if (branchFilter !== 'all' && profile?.branch_id) {
          memberQuery = memberQuery.eq('branch_id', branchFilter);
        }

        const { data: members, count } = await memberQuery.order('created_at', { ascending: false }).limit(5);

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const { count: newCount } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('is_archived', false)
          .gte('date_joined', monthStart.toISOString().split('T')[0]);

        const { count: visitorCount } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('is_archived', false)
          .eq('membership_status', 'visitor');

        const { count: activeCount } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('is_archived', false)
          .eq('membership_status', 'active');

        const { count: branchCount } = await supabase
          .from('branches')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true);

        const { count: pendingCount } = await supabase
          .from('followups')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');

        const { count: newVisitorCount } = await supabase
          .from('visitors')
          .select('id', { count: 'exact', head: true })
          .in('journey_status', ['first_visit', 'follow_up']);

        const { data: recentSessions } = await supabase
          .from('attendance_sessions')
          .select('total_attendance')
          .order('session_date', { ascending: false })
          .limit(1);

        setStats({
          totalMembers: count || 0,
          newMembersThisMonth: newCount || 0,
          visitors: visitorCount || 0,
          activeMembers: activeCount || 0,
          totalBranches: branchCount || 0,
          pendingFollowups: pendingCount || 0,
          newVisitors: newVisitorCount || 0,
          lastSundayAttendance: recentSessions?.[0]?.total_attendance || 0,
        });
        setRecentMembers((members as Member[]) || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [branchFilter, profile?.branch_id]);

  // Generate sample chart data based on stats
  const membershipGrowthData = [
    { month: 'Jan', members: Math.max(stats.totalMembers - 8, 10) },
    { month: 'Feb', members: Math.max(stats.totalMembers - 6, 12) },
    { month: 'Mar', members: Math.max(stats.totalMembers - 5, 14) },
    { month: 'Apr', members: Math.max(stats.totalMembers - 4, 16) },
    { month: 'May', members: Math.max(stats.totalMembers - 3, 18) },
    { month: 'Jun', members: Math.max(stats.totalMembers - 2, 20) },
    { month: 'Jul', members: Math.max(stats.totalMembers - 1, 22) },
    { month: 'Aug', members: Math.max(stats.totalMembers, 24) },
    { month: 'Sep', members: stats.totalMembers },
  ];

  const attendanceTrendData = [
    { week: 'W1', attendance: 145, capacity: 200 },
    { week: 'W2', attendance: 152, capacity: 200 },
    { week: 'W3', attendance: 138, capacity: 200 },
    { week: 'W4', attendance: 167, capacity: 200 },
    { week: 'W5', attendance: 175, capacity: 200 },
    { week: 'W6', attendance: 160, capacity: 200 },
  ];

  const statusDistribution = [
    { name: 'Active', value: stats.activeMembers },
    { name: 'New Members', value: stats.newMembersThisMonth },
    { name: 'Visitors', value: stats.visitors },
    { name: 'Inactive', value: Math.max(stats.totalMembers - stats.activeMembers - stats.newMembersThisMonth - stats.visitors, 0) },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${profile?.first_name || 'Admin'}. Here's what's happening at your church.`}
      >
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            <SelectItem value={profile?.branch_id || ''}>My Branch</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Total Members"
              value={stats.totalMembers}
              icon={<Users className="h-5 w-5" />}
              trend={{ value: '+12% from last month', positive: true }}
            />
            <StatCard
              label="New This Month"
              value={stats.newMembersThisMonth}
              icon={<UserPlus className="h-5 w-5" />}
              trend={{ value: 'Growing steadily', positive: true }}
            />
            <StatCard
              label="First-time Visitors"
              value={stats.visitors}
              icon={<CalendarCheck className="h-5 w-5" />}
            />
            <StatCard
              label="Active Branches"
              value={stats.totalBranches}
              icon={<Church className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Membership Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={membershipGrowthData}>
                <defs>
                  <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174 55% 41%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(174 55% 41%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="members"
                  stroke="hsl(174 55% 41%)"
                  strokeWidth={2}
                  fill="url(#colorMembers)"
                  name="Members"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="attendance" fill="hsl(210 70% 50%)" name="Attendance" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 + Recent Members */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Member Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Members</CardTitle>
              <Badge variant="secondary" className="text-xs">{stats.totalMembers} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentMembers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No members yet</p>
            ) : (
              <div className="space-y-1">
                {recentMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                        {member.first_name[0]}{member.last_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDate(member.date_joined)}
                        </p>
                      </div>
                    </div>
                    <MemberStatusBadge status={member.membership_status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-dashed">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Pending Follow-ups</p>
                <p className="text-xs text-muted-foreground">{stats.pendingFollowups} tasks awaiting action</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <HandHeart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">New Visitors</p>
                <p className="text-xs text-muted-foreground">{stats.newVisitors} awaiting follow-up</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Last Service Attendance</p>
                <p className="text-xs text-muted-foreground">{stats.lastSundayAttendance} people checked in</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
