import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGpsTracking } from "@/hooks/useGpsTracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInMinutes, format } from "date-fns";
import { MapPin, Clock, CalendarDays } from "lucide-react";
import { formatTime } from "@/lib/formatTime";

const MemberDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: club } = useQuery({
    queryKey: ["member-club", profile?.club_id],
    queryFn: async () => {
      const { data } = await supabase.from("clubs").select("*").eq("id", profile!.club_id!).single();
      return data;
    },
    enabled: !!profile?.club_id,
  });

  const { data: dayStatus } = useQuery({
    queryKey: ["member-day-status", profile?.club_id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("day_status")
        .select("*")
        .eq("club_id", profile!.club_id!)
        .eq("status_date", today)
        .single();
      return data;
    },
    enabled: !!profile?.club_id,
  });

  const boundary = club?.boundary_lat && club?.boundary_lng
    ? { lat: club.boundary_lat, lng: club.boundary_lng, radius: club.boundary_radius || 100 }
    : null;

  const gps = useGpsTracking(boundary, dayStatus?.is_open || false);

  const { data: todaySessions } = useQuery({
    queryKey: ["today-sessions", user?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("member_id", user!.id)
        .eq("session_date", today)
        .order("start_time", { ascending: true });
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: allSessions } = useQuery({
    queryKey: ["all-sessions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("member_id", user!.id)
        .order("session_date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const todayMinutes = todaySessions?.reduce((acc, s) => {
    if (s.end_time) return acc + differenceInMinutes(new Date(s.end_time), new Date(s.start_time));
    return acc + differenceInMinutes(new Date(), new Date(s.start_time));
  }, 0) || 0;

  const totalMinutes = allSessions?.reduce((acc, s) => {
    if (s.end_time) return acc + differenceInMinutes(new Date(s.end_time), new Date(s.start_time));
    return acc;
  }, 0) || 0;

  const uniqueDays = new Set(allSessions?.map(s => s.session_date)).size;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Zone Status */}
      <Card>
        <CardContent className="py-6">
          <div className={`text-center p-6 rounded-lg ${gps.inZone ? "bg-green-500/10" : "bg-destructive/10"}`}>
            <p className="text-4xl mb-2">{gps.inZone ? "🟢" : "🔴"}</p>
            <p className="text-xl font-bold">{gps.inZone ? "In Zone" : "Out of Zone"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {!boundary ? "No boundary set" : !dayStatus?.is_open ? "Day is closed" : gps.error || (gps.tracking ? "GPS tracking active" : "Waiting for GPS...")}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Today's Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatTime(todayMinutes)}</p>
            <p className="text-xs text-muted-foreground">{todaySessions?.length || 0} sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatTime(totalMinutes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Total Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{uniqueDays}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {todaySessions?.length ? (
            <div className="space-y-2">
              {todaySessions.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-md bg-muted">
                  <span className="text-sm font-medium">Session {i + 1}</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(s.start_time), "HH:mm")} – {s.end_time ? format(new Date(s.end_time), "HH:mm") : "Ongoing"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No sessions today</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberDashboard;
