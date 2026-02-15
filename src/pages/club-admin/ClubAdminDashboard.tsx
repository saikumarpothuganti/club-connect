import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

const ClubAdminDashboard: React.FC = () => {
  const { profile } = useAuth();

  const { data: clubInfo } = useQuery({
    queryKey: ["my-club"],
    queryFn: async () => {
      if (!profile?.club_id) return null;
      const { data } = await supabase.from("clubs").select("*").eq("admin_id", profile.id).single();
      return data;
    },
    enabled: !!profile,
  });

  const clubId = clubInfo?.id || profile?.club_id;

  const { data: attendance, isLoading } = useQuery({
    queryKey: ["club-admin-attendance", clubId],
    queryFn: async () => {
      const { data: members } = await supabase
        .from("profiles")
        .select("id, name, college_id")
        .eq("club_id", clubId!);

      if (!members) return [];

      const result = await Promise.all(
        members.map(async (member) => {
          const { data: sessions } = await supabase
            .from("attendance_sessions")
            .select("*")
            .eq("member_id", member.id)
            .eq("club_id", clubId!)
            .order("session_date", { ascending: true });

          const sessionsByDate: Record<string, any[]> = {};
          let totalMinutes = 0;

          sessions?.forEach((s) => {
            if (!sessionsByDate[s.session_date]) sessionsByDate[s.session_date] = [];
            sessionsByDate[s.session_date].push(s);
            if (s.end_time) {
              totalMinutes += differenceInMinutes(new Date(s.end_time), new Date(s.start_time));
            }
          });

          return { ...member, sessionsByDate, totalHours: (totalMinutes / 60).toFixed(1) };
        })
      );
      return result;
    },
    enabled: !!clubId,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Attendance Dashboard</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>College ID</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance?.map((member) => (
                <Collapsible key={member.id} asChild>
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.college_id}</TableCell>
                        <TableCell>{member.totalHours}h</TableCell>
                        <TableCell className="flex items-center gap-1">
                          {Object.keys(member.sessionsByDate).length} days
                          <ChevronDown className="h-4 w-4" />
                        </TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <tr>
                        <td colSpan={4} className="p-4 bg-muted/30">
                          {Object.entries(member.sessionsByDate).map(([date, sessions]) => (
                            <div key={date} className="mb-3">
                              <p className="font-medium text-sm">{format(new Date(date), "MMM dd, yyyy")}</p>
                              {(sessions as any[]).map((s, i) => (
                                <p key={i} className="text-sm text-muted-foreground ml-4">
                                  Session {i + 1}: {format(new Date(s.start_time), "HH:mm")} –{" "}
                                  {s.end_time ? format(new Date(s.end_time), "HH:mm") : "Ongoing"}
                                </p>
                              ))}
                            </div>
                          ))}
                        </td>
                      </tr>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
              {!attendance?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No members yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubAdminDashboard;
