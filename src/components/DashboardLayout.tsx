import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard, Users, MapPin, Calendar, ClipboardList, 
  Settings, LogOut, Menu, X, Shield, Building2, UserCog
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { roles, profile, signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdmin = roles.includes("super_admin");
  const isClubAdmin = roles.includes("club_admin");

  const navItems: NavItem[] = isSuperAdmin
    ? [
        { label: "Clubs Overview", path: "/admin", icon: <Building2 className="h-4 w-4" /> },
        { label: "Admin Accounts", path: "/admin/accounts", icon: <UserCog className="h-4 w-4" /> },
        { label: "Club Management", path: "/admin/clubs", icon: <Shield className="h-4 w-4" /> },
      ]
    : isClubAdmin
    ? [
        { label: "Attendance", path: "/club-admin", icon: <ClipboardList className="h-4 w-4" /> },
        { label: "Members", path: "/club-admin/members", icon: <Users className="h-4 w-4" /> },
        { label: "Location", path: "/club-admin/location", icon: <MapPin className="h-4 w-4" /> },
        { label: "Day Control", path: "/club-admin/day-control", icon: <Calendar className="h-4 w-4" /> },
      ]
    : [
        { label: "Dashboard", path: "/member", icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: "Attendance", path: "/member/attendance", icon: <ClipboardList className="h-4 w-4" /> },
        { label: "Profile", path: "/member/profile", icon: <Settings className="h-4 w-4" /> },
      ];

  const roleName = isSuperAdmin ? "Super Admin" : isClubAdmin ? "Club Admin" : "Member";

  const sidebar = (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200",
      isMobile && !sidebarOpen && "-translate-x-full"
    )}>
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="font-bold text-lg text-sidebar-foreground">CampusLog</h2>
        <p className="text-xs text-sidebar-foreground/60">{roleName}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => isMobile && setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              location.pathname === item.path
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="px-3 py-2 text-xs text-sidebar-foreground/60 truncate">
          {profile?.name || "User"}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      {sidebar}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={cn("transition-all duration-200", !isMobile && "ml-64")}>
        {isMobile && (
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-foreground">CampusLog</h1>
          </header>
        )}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
