import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Calendar, Power, PowerOff } from "lucide-react";
import { format } from "date-fns";

const DayControl: React.FC = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: club } = useQuery({
    queryKey: ["my-club-day"],
    queryFn: async () => {
      const { data } = await supabase.from("clubs").select("*").eq("admin_id", profile!.id).single();
      return data;
    },
    enabled: !!profile,
  });

  const { data: dayStatus } = useQuery({
    queryKey: ["day-status", club?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("day_status")
        .select("*")
        .eq("club_id", club!.id)
        .eq("status_date", today)
        .single();
      return data;
    },
    enabled: !!club,
  });

  const toggleDay = useMutation({
    mutationFn: async () => {
      if (dayStatus) {
        const { error } = await supabase
          .from("day_status")
          .update({ is_open: !dayStatus.is_open })
          .eq("id", dayStatus.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("day_status")
          .insert({ club_id: club!.id, is_open: true, opened_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day-status"] });
      toast({ title: dayStatus?.is_open ? "Day closed" : "Day opened" });
    },
  });

  const isOpen = dayStatus?.is_open || false;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Day Control</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Today — {format(new Date(), "MMMM dd, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg text-center ${isOpen ? "bg-green-500/10 text-green-700" : "bg-destructive/10 text-destructive"}`}>
            <p className="text-2xl font-bold">{isOpen ? "🟢 Day is Open" : "🔴 Day is Closed"}</p>
            <p className="text-sm mt-1">
              {isOpen ? "Attendance tracking is active" : "Attendance tracking is paused"}
            </p>
          </div>
          <Button
            onClick={() => toggleDay.mutate()}
            disabled={toggleDay.isPending}
            variant={isOpen ? "destructive" : "default"}
            className="w-full"
          >
            {isOpen ? <><PowerOff className="h-4 w-4 mr-2" /> Close Day</> : <><Power className="h-4 w-4 mr-2" /> Open Day</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DayControl;
