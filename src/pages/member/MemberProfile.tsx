import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { User, Key } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const MemberProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: club } = useQuery({
    queryKey: ["profile-club", profile?.club_id],
    queryFn: async () => {
      const { data } = await supabase.from("clubs").select("name").eq("id", profile!.club_id!).single();
      return data;
    },
    enabled: !!profile?.club_id,
  });

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated!" });
      setNewPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{profile?.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">College ID</span><span className="font-medium">{profile?.college_id}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{profile?.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Club</span><span className="font-medium">{club?.name || "Not assigned"}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
          </div>
          <Button onClick={handleChangePassword} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberProfile;
