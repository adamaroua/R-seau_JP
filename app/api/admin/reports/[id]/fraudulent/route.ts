import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/route-auth";
import { jsonError, jsonOk } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  try {
    const profile = await requireStaff(supabase);
    const { id } = await context.params;
    const body = (await request.json()) as { value?: boolean };

    const { data, error } = await supabase
      .from("reports")
      .update({
        marked_fraudulent: Boolean(body.value),
        moderator_id: profile.id,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) return jsonError(error.message, 400);
    return jsonOk({ report: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 403);
  }
}
