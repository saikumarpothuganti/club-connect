import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GpsState {
  latitude: number | null;
  longitude: number | null;
  inZone: boolean;
  error: string | null;
  tracking: boolean;
}

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useGpsTracking(
  clubBoundary: { lat: number; lng: number; radius: number } | null,
  isDayOpen: boolean
) {
  const { user, profile } = useAuth();
  const [state, setState] = useState<GpsState>({
    latitude: null, longitude: null, inZone: false, error: null, tracking: false,
  });
  const activeSessionRef = useRef<string | null>(null);
  const wasInZoneRef = useRef(false);

  const startSession = useCallback(async () => {
    if (!user || !profile?.club_id) return;
    const { data } = await supabase
      .from("attendance_sessions")
      .insert({ member_id: user.id, club_id: profile.club_id })
      .select("id")
      .single();
    if (data) activeSessionRef.current = data.id;
  }, [user, profile]);

  const endSession = useCallback(async () => {
    if (!activeSessionRef.current) return;
    await supabase
      .from("attendance_sessions")
      .update({ end_time: new Date().toISOString() })
      .eq("id", activeSessionRef.current);
    activeSessionRef.current = null;
  }, []);

  useEffect(() => {
    if (!clubBoundary || !isDayOpen || !navigator.geolocation) {
      setState(prev => ({ ...prev, tracking: false, error: !navigator.geolocation ? "Geolocation not supported" : null }));
      return;
    }

    setState(prev => ({ ...prev, tracking: true }));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceMeters(latitude, longitude, clubBoundary.lat, clubBoundary.lng);
        const inZone = distance <= clubBoundary.radius;

        setState({ latitude, longitude, inZone, error: null, tracking: true });

        // Zone transition logic
        if (inZone && !wasInZoneRef.current) {
          startSession();
        } else if (!inZone && wasInZoneRef.current) {
          endSession();
        }
        wasInZoneRef.current = inZone;
      },
      (error) => {
        setState(prev => ({ ...prev, error: error.message, tracking: false }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (wasInZoneRef.current) endSession();
    };
  }, [clubBoundary, isDayOpen, startSession, endSession]);

  return state;
}
