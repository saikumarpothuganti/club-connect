import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    // Check super_admin role
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin");

    if (!callerRoles?.length) throw new Error("Unauthorized");

    const { name, email, college_id, password, club_id } = await req.json();

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, college_id },
    });
    if (createError) throw createError;

    // Assign club_admin role
    await supabaseAdmin.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "club_admin",
    });

    // Remove default member role
    await supabaseAdmin.from("user_roles").delete()
      .eq("user_id", newUser.user.id)
      .eq("role", "member");

    // Update profile with club_id
    if (club_id) {
      await supabaseAdmin.from("profiles").update({ club_id }).eq("id", newUser.user.id);
      // Set this admin as club admin
      await supabaseAdmin.from("clubs").update({ admin_id: newUser.user.id }).eq("id", club_id);
    }

    return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
