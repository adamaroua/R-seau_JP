import { siteUrl } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/api";
import { identifierToAuthEmail } from "@/lib/auth-identifier";
import { hashRequestIp } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Inscription invalide");
  }

  const admin = createSupabaseAdminClient();
  const ipHash = await hashRequestIp();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await admin
    .from("action_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("action", "register")
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if ((count ?? 0) >= 5) {
    return jsonError("Trop de comptes crees depuis ce reseau aujourd'hui", 429);
  }

  const { data: existingUsername } = await admin
    .from("users")
    .select("id")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (existingUsername) return jsonError("Pseudo deja pris", 409);

  await admin.from("action_rate_limits").insert({
    action: "register",
    ip_hash: ipHash,
    user_id: null
  });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: identifierToAuthEmail(parsed.data.username),
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/feed`,
      data: {
        username: parsed.data.username
      }
    }
  });

  if (error) return jsonError(error.message, 400);
  return jsonOk({ created: true }, 201);
}
