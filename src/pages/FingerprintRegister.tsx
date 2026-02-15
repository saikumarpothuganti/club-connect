import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const FingerprintRegister: React.FC = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = roles.includes("club_admin") ? "/club-admin" : "/member";

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  const handleRegister = async () => {
    if (!user) return;
    setRegistering(true);
    setError(null);

    try {
      if (!window.PublicKeyCredential) {
        throw new Error("Your device does not support biometric authentication. Registration blocked.");
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "CampusLog", id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(user.id),
            name: user.email || "user",
            displayName: user.email || "User",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!credential) throw new Error("Registration cancelled");

      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialId = bufferToBase64url(credential.rawId);
      const publicKey = bufferToBase64url(response.attestationObject);

      await supabase.from("webauthn_credentials").insert({
        user_id: user.id,
        credential_id: credentialId,
        public_key: publicKey,
        device_name: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop",
      });

      toast({ title: "Fingerprint registered successfully!" });
      navigate("/fingerprint-verify", { replace: true });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Fingerprint sensor not available or access denied. Registration blocked.");
      } else {
        setError(err.message || "Registration failed");
      }
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Register Your Fingerprint</CardTitle>
          <CardDescription>Biometric authentication is required to use CampusLog</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
            <Fingerprint className="h-16 w-16 text-primary" />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button onClick={handleRegister} disabled={registering} className="w-full">
            {registering ? "Registering..." : "Register Fingerprint"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FingerprintRegister;
