import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/pages/auth/login-page';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { MembersListPage } from '@/pages/members/members-list-page';
import { MemberFormPage } from '@/pages/members/member-form-page';
import { MemberDetailPage } from '@/pages/members/member-detail-page';
import { SettingsPage } from '@/pages/settings-page';
import { ProfilePage } from '@/pages/profile-page';
import { ComingSoonPage } from '@/pages/coming-soon-page';
import { AttendancePage } from '@/pages/attendance-page';
import { VisitorsPage } from '@/pages/visitors-page';
import { FollowupsPage } from '@/pages/followups-page';
import { MinistriesPage } from '@/pages/ministries-page';
import { EventsPage } from '@/pages/events-page';
import { QrScannerPage } from '@/pages/qr-scanner-page';
import { QrDisplayPage } from '@/pages/attendance/qr-display-page';
import { SessionDetailPage } from '@/pages/attendance/session-detail-page';
import { SelfCheckInPage } from '@/pages/checkin/self-check-in-page';
import { Toaster } from '@/components/ui/toaster';
import {
  CalendarDays, ClipboardList, ScanLine, Church, Bell, BookOpen,
  Wallet, HandHeart, MessageSquare, FileText,
} from 'lucide-react';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/checkin" element={<SelfCheckInPage />} />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members" element={<ProtectedRoute permission="members.view"><MembersListPage /></ProtectedRoute>} />
        <Route path="/members/new" element={<ProtectedRoute permission="members.manage"><MemberFormPage /></ProtectedRoute>} />
        <Route path="/members/:id" element={<ProtectedRoute permission="members.view"><MemberDetailPage /></ProtectedRoute>} />
        <Route path="/members/:id/edit" element={<ProtectedRoute permission="members.manage"><MemberFormPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<ProtectedRoute permission="settings.view"><SettingsPage /></ProtectedRoute>} />

        {/* Phase 2 — Functional */}
        <Route path="/events" element={<EventsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/attendance/:sessionId/details" element={<SessionDetailPage />} />
        <Route path="/attendance/:sessionId/qr-display" element={<QrDisplayPage />} />
        <Route path="/qr-scanner" element={<QrScannerPage />} />
        <Route path="/ministries" element={<MinistriesPage />} />
        <Route path="/followups" element={<FollowupsPage />} />
        <Route path="/visitors" element={<VisitorsPage />} />
        <Route path="/discipleship" element={<ComingSoonPage title="Discipleship" description="Track discipleship and training programs" icon={BookOpen} phase="Phase 4" />} />
        <Route path="/finance" element={<ComingSoonPage title="Finance" description="Manage church income and expenses" icon={Wallet} phase="Phase 3" />} />
        <Route path="/giving" element={<ComingSoonPage title="Giving" description="Track member giving and contributions" icon={HandHeart} phase="Phase 3" />} />
        <Route path="/prayer-requests" element={<ComingSoonPage title="Prayer Requests" description="Submit and manage prayer requests" icon={MessageSquare} phase="Phase 4" />} />
        <Route path="/documents" element={<ComingSoonPage title="Documents" description="Generate church letters and certificates" icon={FileText} phase="Phase 3" />} />
        <Route path="/reports" element={<ComingSoonPage title="Reports" description="Generate comprehensive church reports" icon={ClipboardList} phase="Phase 3" />} />
        <Route path="/notifications" element={<ComingSoonPage title="Notifications" description="View and manage your notifications" icon={Bell} phase="Phase 4" />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
