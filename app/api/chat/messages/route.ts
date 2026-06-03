import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRouteUser } from "@/lib/route-auth";
import { messageSchema } from "@/lib/validation";
import { signedAvatarUrl } from "@/lib/storage";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    await getRouteUser(supabase);
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) return jsonError("Conversation requise");

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(120);

    if (error) return jsonError(error.message, 403);

    const senderIds = Array.from(new Set((messages ?? []).map((message) => message.sender_id)));
    const { data: senders } = senderIds.length
      ? await supabase.from("users").select("*").in("id", senderIds)
      : { data: [] };
    const senderById = new Map((senders ?? []).map((sender) => [sender.id, sender]));

    const hydrated = await Promise.all(
      (messages ?? []).map(async (message) => {
        const sender = senderById.get(message.sender_id);
        return {
          id: message.id,
          conversation_id: message.conversation_id,
          body: message.body,
          created_at: message.created_at,
          sender: {
            id: message.sender_id,
            username: sender?.username ?? "inconnu",
            display_name: sender?.display_name ?? null,
            role: sender?.role ?? "user",
            avatar_url: await signedAvatarUrl(supabase, sender?.avatar_path ?? null)
          }
        };
      })
    );

    return jsonOk({ messages: hydrated });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);
    await assertRateLimit(supabase, "send_message", 80, 60 * 60);

    const parsed = messageSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Message invalide");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: parsed.data.conversationId,
        sender_id: user.id,
        body: parsed.data.body
      })
      .select("id")
      .single();

    if (error) return jsonError(error.message, 403);
    return jsonOk({ id: data.id }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
