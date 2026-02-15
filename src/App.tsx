import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ClubAttendanceView from "@/pages/admin/ClubAttendanceView";
import AdminAccounts from "@/pages/admin/AdminAccounts";
import ClubManagement from "@/pages/admin/ClubManagement";
import ClubAdminDashboard from "@/pages/club-admin/ClubAdminDashboard";
import MembersManagement from "@/pages/club-admin/MembersManagement";
import LocationBoundary from "@/pages/club-admin/LocationBoundary";
import DayControl from "@/pages/club-admin/DayControl";
import MemberDashboard from "@/pages/member/MemberDashboard";
import AttendanceHistory from "@/pages/member/AttendanceHistory";
import MemberProfile from "@/pages/member/MemberProfile";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const HomeRedirect = () => {
  const { user, roles, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles.includes("super_admin")) return <Navigate to="/admin" replace />;
  if (roles.includes("club_admin")) return <Navigate to="/club-admin" replace />;
  return <Navigate to="/member" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Super Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="super_admin"><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/club/:clubId" element={<ProtectedRoute requiredRole="super_admin"><DashboardLayout><ClubAttendanceView /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/accounts" element={<ProtectedRoute requiredRole="super_admin"><DashboardLayout><AdminAccounts /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/clubs" element={<ProtectedRoute requiredRole="super_admin"><DashboardLayout><ClubManagement /></DashboardLayout></ProtectedRoute>} />

            {/* Club Admin Routes */}
            <Route path="/club-admin" element={<ProtectedRoute requiredRole="club_admin"><DashboardLayout><ClubAdminDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/club-admin/members" element={<ProtectedRoute requiredRole="club_admin"><DashboardLayout><MembersManagement /></DashboardLayout></ProtectedRoute>} />
            <Route path="/club-admin/location" element={<ProtectedRoute requiredRole="club_admin"><DashboardLayout><LocationBoundary /></DashboardLayout></ProtectedRoute>} />
            <Route path="/club-admin/day-control" element={<ProtectedRoute requiredRole="club_admin"><DashboardLayout><DayControl /></DashboardLayout></ProtectedRoute>} />

            {/* Member Routes */}
            <Route path="/member" element={<ProtectedRoute requiredRole="member"><DashboardLayout><MemberDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/member/attendance" element={<ProtectedRoute requiredRole="member"><DashboardLayout><AttendanceHistory /></DashboardLayout></ProtectedRoute>} />
            <Route path="/member/profile" element={<ProtectedRoute requiredRole="member"><DashboardLayout><MemberProfile /></DashboardLayout></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
