import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { differenceInMinutes, format } from "date-fns";
import { ChevronDown } from "lucide-react";

const AttendanceHistory: React.FC = () => {
  const { user } = useAuth();

  const { data: sessionsByDate, isLoading } = useQuery({
    queryKey: ["member-attendance-history", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("member_id", user!.id)
        .order("session_date", { ascending: false });

      const grouped: Record<string, typeof data> = {};
      data?.forEach((s) => {
        if (!grouped[s.session_date]) grouped[s.session_date] = [];
        grouped[s.session_date]!.push(s);
      });
      return grouped;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const dates = Object.keys(sessionsByDate || {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Attendance History</h1>
      {!dates.length ? (
        <p className="text-muted-foreground">No attendance records yet.</p>
      ) : (
        <div className="space-y-3">
          {dates.map((date) => {
            const sessions = sessionsByDate![date]!;
            const totalMin = sessions.reduce((acc, s) => {
              if (s.end_time) return acc + differenceInMinutes(new Date(s.end_time), new Date(s.start_time));
              return acc;
            }, 0);

            return (
              <Collapsible key={date}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between py-3">
                      <CardTitle className="text-base">{format(new Date(date), "EEEE, MMMM dd, yyyy")}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{(totalMin / 60).toFixed(1)}h • {sessions.length} sessions</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-2">
                      {sessions.map((s, i) => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-md bg-muted">
                          <span className="text-sm font-medium">Session {i + 1}</span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(s.start_time), "HH:mm")} – {s.end_time ? format(new Date(s.end_time), "HH:mm") : "Ongoing"}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
