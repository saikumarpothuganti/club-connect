import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { MapPin, Locate } from "lucide-react";

const LocationBoundary: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [radius, setRadius] = useState("100");

  const { data: club } = useQuery({
    queryKey: ["my-club-location"],
    queryFn: async () => {
      const { data } = await supabase.from("clubs").select("*").eq("admin_id", profile!.id).single();
      if (data) setRadius(String(data.boundary_radius || 100));
      return data;
    },
    enabled: !!profile,
  });

  const updateBoundary = useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }) => {
      const { error } = await supabase
        .from("clubs")
        .update({ boundary_lat: lat, boundary_lng: lng, boundary_radius: parseFloat(radius) })
        .eq("id", club!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-club-location"] });
      toast({ title: "Location boundary updated!" });
    },
  });

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS not supported", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateBoundary.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        toast({ title: "GPS Error", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Location Boundary</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Club Boundary Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {club?.boundary_lat && (
            <div className="p-3 rounded-md bg-muted text-sm space-y-1">
              <p>Current: {club.boundary_lat.toFixed(6)}, {club.boundary_lng?.toFixed(6)}</p>
              <p>Radius: {club.boundary_radius}m</p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Boundary Radius (meters)</Label>
            <Input type="number" value={radius} onChange={(e) => setRadius(e.target.value)} min="10" max="5000" />
          </div>
          <Button onClick={captureLocation} disabled={updateBoundary.isPending} className="w-full">
            <Locate className="h-4 w-4 mr-2" />
            {updateBoundary.isPending ? "Capturing..." : "Set Current Location as Boundary"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationBoundary;
