import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/route-auth";
import { signedPostUrl } from "@/lib/storage";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  try {
    await requireStaff(supabase);

    const { data: reports, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) return jsonError(error.message, 500);

    const postIds = Array.from(new Set((reports ?? []).map((report) => report.post_id)));
    const userIds = Array.from(
      new Set(
        (reports ?? [])
          .flatMap((report) => [report.reporter_id, report.moderator_id])
          .filter((id): id is string => Boolean(id))
      )
    );

    const [{ data: posts }, { data: users }] = await Promise.all([
      postIds.length ? supabase.from("posts").select("*").in("id", postIds) : { data: [] },
      userIds.length ? supabase.from("users").select("*").in("id", userIds) : { data: [] }
    ]);

    const postById = new Map((posts ?? []).map((post) => [post.id, post]));
    const userById = new Map((users ?? []).map((user) => [user.id, user]));

    const hydrated = await Promise.all(
      (reports ?? []).map(async (report) => {
        const post = postById.get(report.post_id);
        const reporter = userById.get(report.reporter_id);
        const moderator = report.moderator_id ? userById.get(report.moderator_id) : null;

        return {
          ...report,
          post: post
            ? {
                id: post.id,
                body: post.body,
                image_url: await signedPostUrl(supabase, post.image_path),
                created_at: post.created_at
              }
            : null,
          reporter: reporter
            ? { id: reporter.id, username: reporter.username, role: reporter.role }
            : null,
          moderator: moderator
            ? { id: moderator.id, username: moderator.username, role: moderator.role }
            : null
        };
      })
    );

    return jsonOk({ reports: hydrated });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 403);
  }
}
