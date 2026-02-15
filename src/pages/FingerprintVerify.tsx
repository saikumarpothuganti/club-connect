import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fingerprint, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const FingerprintVerify: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = roles.includes("club_admin") ? "/club-admin" : "/member";

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const handleVerify = async () => {
    if (!user) return;
    setVerifying(true);
    setError(null);

    try {
      // Check if user has credentials
      const { data: creds } = await supabase
        .from("webauthn_credentials")
        .select("credential_id, public_key")
        .eq("user_id", user.id);

      if (!creds || creds.length === 0) {
        navigate("/fingerprint-register", { replace: true });
        return;
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const allowCredentials = creds.map((c) => ({
        id: base64urlToBuffer(c.credential_id),
        type: "public-key" as const,
      }));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials,
          userVerification: "required",
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!assertion) throw new Error("Verification cancelled");

      const credId = bufferToBase64url(assertion.rawId);
      const matched = creds.find((c) => c.credential_id === credId);
      if (!matched) throw new Error("Fingerprint does not match any registered credential");

      // Update last_used
      await supabase
        .from("webauthn_credentials")
        .update({ last_used: new Date().toISOString() })
        .eq("credential_id", credId);

      toast({ title: "Identity verified!" });
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Fingerprint sensor not available or access denied. Login blocked.");
      } else {
        setError(err.message || "Verification failed");
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Verify Your Identity</CardTitle>
          <CardDescription>Place your finger on the fingerprint sensor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20 disabled:opacity-50"
          >
            <Fingerprint className={`h-16 w-16 text-primary ${verifying ? "animate-pulse" : ""}`} />
          </button>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button onClick={handleVerify} disabled={verifying} className="w-full">
            {verifying ? "Verifying..." : "Verify Fingerprint"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FingerprintVerify;
