import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseRpc } from "@/lib/supabase/rpc";
import { assertRateLimit } from "@/lib/rate-limit";
import { hydrateFeedPosts } from "@/lib/feed";
import { getRouteUser } from "@/lib/route-auth";
import { jsonError, jsonOk } from "@/lib/api";
import {
  allowedImageTypes,
  cleanText,
  hasValidImageSignature,
  imageExtension,
  postSchema
} from "@/lib/validation";
import { MAX_POST_IMAGE_BYTES, POST_MEDIA_BUCKET, removePostMedia } from "@/lib/storage";
import type { FeedPostRow } from "@/types/database";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return jsonError("Connexion requise", 401);

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const scope = searchParams.get("scope") ?? "all";
  const username = searchParams.get("username");

  const { data, error } = await supabaseRpc<FeedPostRow[]>(supabase, "get_feed_posts", {
    p_viewer: user.id,
    p_limit: 15,
    p_cursor: cursor,
    p_scope: scope,
    p_username: username
  });

  if (error) return jsonError(error.message, 500);

  const posts = await hydrateFeedPosts(supabase, data);
  const nextCursor = posts.length === 15 ? posts[posts.length - 1]?.created_at ?? null : null;

  return jsonOk({ posts, nextCursor });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);
    await assertRateLimit(supabase, "create_post", 8, 60 * 60);

    const formData = await request.formData();
    const body = cleanText(formData.get("body"));
    const parsed = postSchema.safeParse({ body });
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Post invalide");

    const file = formData.get("image");
    let imagePath: string | null = null;
    let imageBytes = 0;

    if (file instanceof File && file.size > 0) {
      if (!allowedImageTypes.has(file.type)) return jsonError("Format image refuse");
      if (!(await hasValidImageSignature(file))) return jsonError("Fichier image invalide");
      if (file.size > MAX_POST_IMAGE_BYTES) return jsonError("Image trop lourde (5 Mo max)");

      const { data: quotaOk } = await supabaseRpc<boolean>(supabase, "can_upload_bytes", {
        p_user: user.id,
        p_bytes: file.size
      });
      if (!quotaOk) return jsonError("Limite de 10 Mo uploades aujourd'hui atteinte", 429);

      const ext = imageExtension(file.type);
      if (!ext) return jsonError("Format image refuse");

      imagePath = `${user.id}/${randomUUID()}.${ext}`;
      imageBytes = file.size;

      const { error: uploadError } = await supabase.storage
        .from(POST_MEDIA_BUCKET)
        .upload(imagePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) return jsonError(uploadError.message, 400);
    }

    if (!body && !imagePath) return jsonError("Ajoute un texte, une image, ou les deux");

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        body: body || null,
        image_path: imagePath,
        image_bytes: imageBytes
      })
      .select("id")
      .single();

    if (error) {
      await removePostMedia(supabase, imagePath);
      return jsonError(error.message, 400);
    }

    return jsonOk({ id: data.id }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
