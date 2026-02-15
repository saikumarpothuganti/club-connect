import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, UserCog } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard: React.FC = () => {
  const { data: clubs, isLoading } = useQuery({
    queryKey: ["admin-clubs"],
    queryFn: async () => {
      const { data: clubsData } = await supabase.from("clubs").select("*");
      if (!clubsData) return [];

      const enriched = await Promise.all(
        clubsData.map(async (club) => {
          const { count } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("club_id", club.id);

          let adminName = "Unassigned";
          if (club.admin_id) {
            const { data: adminProfile } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", club.admin_id)
              .single();
            adminName = adminProfile?.name || "Unknown";
          }

          return { ...club, memberCount: count || 0, adminName };
        })
      );
      return enriched;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Clubs Overview</h1>
      {!clubs?.length ? (
        <p className="text-muted-foreground">No clubs created yet. Go to Club Management to create one.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <Link key={club.id} to={`/admin/club/${club.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{club.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserCog className="h-4 w-4" />
                    <span>Admin: {club.adminName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{club.memberCount} Members</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
