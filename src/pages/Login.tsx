import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Shield, Users, User } from "lucide-react";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "member";
  const [loading, setLoading] = useState(false);

  // Super Admin state
  const [saCollegeId, setSaCollegeId] = useState("");
  const [saPassword, setSaPassword] = useState("");

  // Regular login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("super-admin-login", {
        body: { college_id: saCollegeId, password: saPassword },
      });
      if (res.error) throw new Error(res.error.message);
      const { session } = res.data;
      if (!session?.access_token) throw new Error("Login failed");
      
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      toast({ title: "Welcome, Super Admin!" });
      navigate("/admin");
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegularLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Redirect to fingerprint verification (separate page)
      toast({ title: "Credentials verified. Please verify your identity." });
      navigate("/fingerprint-verify");
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">CampusLog</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="member" className="gap-1">
                <User className="h-3 w-3" /> Member
              </TabsTrigger>
              <TabsTrigger value="club-admin" className="gap-1">
                <Users className="h-3 w-3" /> Club Admin
              </TabsTrigger>
              <TabsTrigger value="super-admin" className="gap-1">
                <Shield className="h-3 w-3" /> Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="member">
              <form onSubmit={handleRegularLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="member-email">Email</Label>
                  <Input id="member-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-password">Password</Label>
                  <Input id="member-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="club-admin">
              <form onSubmit={handleRegularLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="ca-email">Email</Label>
                  <Input id="ca-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ca-password">Password</Label>
                  <Input id="ca-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="super-admin">
              <form onSubmit={handleSuperAdminLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="sa-college-id">College ID</Label>
                  <Input id="sa-college-id" value={saCollegeId} onChange={(e) => setSaCollegeId(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sa-password">Password</Label>
                  <Input id="sa-password" type="password" value={saPassword} onChange={(e) => setSaPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In as Super Admin"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">Register</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
