import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRouteUser } from "@/lib/route-auth";
import { createConversationSchema } from "@/lib/validation";
import { signedAvatarUrl } from "@/lib/storage";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);

    const { data: memberships, error } = await supabase
      .from("conversation_members")
      .select("conversation_id,read_at")
      .eq("user_id", user.id);

    if (error) return jsonError(error.message, 500);

    const conversationIds = (memberships ?? []).map((row) => row.conversation_id);
    if (conversationIds.length === 0) return jsonOk({ conversations: [] });

    const [{ data: conversations }, { data: members }, { data: messages }] = await Promise.all([
      supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("last_message_at", { ascending: false }),
      supabase.from("conversation_members").select("*").in("conversation_id", conversationIds),
      supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
        .limit(80)
    ]);

    const otherIds = Array.from(
      new Set((members ?? []).map((member) => member.user_id).filter((id) => id !== user.id))
    );
    const { data: users } = otherIds.length
      ? await supabase.from("users").select("*").in("id", otherIds)
      : { data: [] };

    const userById = new Map((users ?? []).map((profile) => [profile.id, profile]));
    const membersByConversation = new Map<string, string[]>();
    for (const member of members ?? []) {
      const list = membersByConversation.get(member.conversation_id) ?? [];
      list.push(member.user_id);
      membersByConversation.set(member.conversation_id, list);
    }

    type MessageRow = NonNullable<typeof messages>[number];
    const lastMessageByConversation = new Map<string, MessageRow>();
    for (const message of messages ?? []) {
      if (!lastMessageByConversation.has(message.conversation_id)) {
        lastMessageByConversation.set(message.conversation_id, message);
      }
    }

    const hydrated = await Promise.all(
      (conversations ?? []).map(async (conversation) => {
        const otherId = (membersByConversation.get(conversation.id) ?? []).find((id) => id !== user.id);
        const other = otherId ? userById.get(otherId) : null;
        return {
          id: conversation.id,
          last_message_at: conversation.last_message_at,
          last_message: lastMessageByConversation.get(conversation.id)?.body ?? null,
          other: other
            ? {
                id: other.id,
                username: other.username,
                display_name: other.display_name,
                role: other.role,
                avatar_url: await signedAvatarUrl(supabase, other.avatar_path)
              }
            : null
        };
      })
    );

    return jsonOk({ conversations: hydrated });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);
    await assertRateLimit(supabase, "create_conversation", 12, 60 * 60);

    const parsed = createConversationSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Pseudo invalide");

    const admin = createSupabaseAdminClient();
    const { data: target, error: targetError } = await admin
      .from("users")
      .select("*")
      .eq("username", parsed.data.username)
      .single();

    if (targetError || !target) return jsonError("Utilisateur introuvable", 404);
    if (target.id === user.id) return jsonError("Impossible de creer une conversation avec soi-meme");

    const { data: ownMemberships } = await admin
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);
    const ownConversationIds = (ownMemberships ?? []).map((row) => row.conversation_id);

    if (ownConversationIds.length) {
      const { data: existingTargetMembership } = await admin
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", target.id)
        .in("conversation_id", ownConversationIds)
        .maybeSingle();

      if (existingTargetMembership) {
        return jsonOk({ id: existingTargetMembership.conversation_id });
      }
    }

    const { data: conversation, error: createError } = await admin
      .from("conversations")
      .insert({ created_by: user.id })
      .select("id")
      .single();

    if (createError || !conversation) return jsonError(createError?.message ?? "Erreur creation", 400);

    const { error: memberError } = await admin.from("conversation_members").insert([
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: target.id }
    ]);

    if (memberError) return jsonError(memberError.message, 400);
    return jsonOk({ id: conversation.id }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
