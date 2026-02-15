import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPER_ADMIN_COLLEGE_ID = "superadminklu";
const SUPER_ADMIN_PASSWORD = "superadmin@321@123";
const SUPER_ADMIN_EMAIL = "superadmin@clubsystem.internal";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { college_id, password } = await req.json();

    if (college_id !== SUPER_ADMIN_COLLEGE_ID || password !== SUPER_ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if super admin user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let superAdminUser = existingUsers?.users?.find(u => u.email === SUPER_ADMIN_EMAIL);

    if (!superAdminUser) {
      // Create the super admin user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { name: "Super Admin", college_id: SUPER_ADMIN_COLLEGE_ID },
      });
      if (createError) throw createError;
      superAdminUser = newUser.user;

      // Assign super_admin role
      await supabaseAdmin.from("user_roles").insert({
        user_id: superAdminUser.id,
        role: "super_admin",
      });
    }

    // Sign in as super admin
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: SUPER_ADMIN_EMAIL,
    });

    // Use signInWithPassword approach instead
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const signInResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
      },
      body: JSON.stringify({
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
      }),
    });

    const session = await signInResponse.json();

    if (!signInResponse.ok) {
      throw new Error(session.error_description || session.msg || "Login failed");
    }

    return new Response(JSON.stringify({ session }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
