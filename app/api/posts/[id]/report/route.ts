import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRouteUser } from "@/lib/route-auth";
import { reportSchema } from "@/lib/validation";
import { jsonError, jsonOk } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);
    await assertRateLimit(supabase, "report_post", 10, 60 * 60);

    const { id } = await context.params;
    const parsed = reportSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Signalement invalide");

    const { error } = await supabase.from("reports").insert({
      post_id: id,
      reporter_id: user.id,
      reason: parsed.data.reason
    });

    if (error) return jsonError("Post deja signale ou introuvable", 400);
    return jsonOk({ reported: true }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
