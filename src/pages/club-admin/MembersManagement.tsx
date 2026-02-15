import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

const MembersManagement: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const clubId = profile?.club_id;

  const { data: members, isLoading } = useQuery({
    queryKey: ["club-members", clubId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("club_id", clubId!)
        .neq("id", profile!.id);
      return data || [];
    },
    enabled: !!clubId,
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ club_id: null })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-members"] });
      toast({ title: "Member removed from club" });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Members Management</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>College ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.college_id}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeMember.mutate(member.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!members?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No members in this club</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembersManagement;
