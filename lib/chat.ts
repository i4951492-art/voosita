import { supabase } from "./supabase";
import { getCurrentUser } from "./store";
import { UUID_RE } from "./util";

export type Conversation = {
  id: string;
  kind: "direct" | "support";
  userA: string;
  userB: string | null;
  listingId: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

type CRow = {
  id: string;
  kind: "direct" | "support";
  user_a: string;
  user_b: string | null;
  listing_id: string | null;
  last_message: string | null;
  last_message_at: string;
};

type MRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

const CSELECT = "id, kind, user_a, user_b, listing_id, last_message, last_message_at";
const MSELECT = "id, conversation_id, sender_id, body, created_at, read_at";

const cFromRow = (r: CRow): Conversation => ({
  id: r.id,
  kind: r.kind,
  userA: r.user_a,
  userB: r.user_b,
  listingId: r.listing_id,
  lastMessage: r.last_message,
  lastMessageAt: r.last_message_at,
});

const mFromRow = (r: MRow): Message => ({
  id: r.id,
  conversationId: r.conversation_id,
  senderId: r.sender_id,
  body: r.body,
  createdAt: r.created_at,
  readAt: r.read_at,
});

function need() {
  const me = getCurrentUser();
  if (!supabase || !me) throw new Error("NOT_LOGGED_IN");
  return { db: supabase, me };
}

export async function fetchConversations(): Promise<Conversation[]> {
  const { db } = need();
  const { data, error } = await db
    .from("conversations")
    .select(CSELECT)
    .order("last_message_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as CRow[]).map(cFromRow);
}

export async function fetchConversation(id: string): Promise<Conversation | null> {
  if (!UUID_RE.test(id)) return null;
  const { db } = need();
  const { data, error } = await db.from("conversations").select(CSELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? cFromRow(data as CRow) : null;
}

export async function getOrCreateDirect(otherId: string, listingId?: string): Promise<string> {
  if (!UUID_RE.test(otherId)) throw new Error("Некорректный пользователь");
  const { db, me } = need();
  if (otherId === me.id) throw new Error("Нельзя написать самому себе");

  const find = async () => {
    const { data } = await db
      .from("conversations")
      .select("id")
      .eq("kind", "direct")
      .or(`and(user_a.eq.${me.id},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${me.id})`)
      .limit(1);
    return data && data.length > 0 ? (data[0] as { id: string }).id : null;
  };

  const existing = await find();
  if (existing) return existing;

  const { data, error } = await db
    .from("conversations")
    .insert({
      kind: "direct",
      user_a: me.id,
      user_b: otherId,
      listing_id: listingId && UUID_RE.test(listingId) ? listingId : null,
    })
    .select("id")
    .single();
  if (error) {
    const again = await find(); // the other side may have created it at the same time
    if (again) return again;
    throw error;
  }
  return (data as { id: string }).id;
}

export async function getOrCreateSupport(): Promise<string> {
  const { db, me } = need();
  const { data: found } = await db
    .from("conversations")
    .select("id")
    .eq("kind", "support")
    .eq("user_a", me.id)
    .limit(1);
  if (found && found.length > 0) return (found[0] as { id: string }).id;
  const { data, error } = await db
    .from("conversations")
    .insert({ kind: "support", user_a: me.id, user_b: null })
    .select("id")
    .single();
  if (error) {
    const { data: again } = await db
      .from("conversations")
      .select("id")
      .eq("kind", "support")
      .eq("user_a", me.id)
      .limit(1);
    if (again && again.length > 0) return (again[0] as { id: string }).id;
    throw error;
  }
  return (data as { id: string }).id;
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { db } = need();
  const { data, error } = await db
    .from("messages")
    .select(MSELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(300);
  if (error) throw error;
  return ((data ?? []) as MRow[]).map(mFromRow);
}

export async function sendMessage(conversationId: string, body: string): Promise<Message> {
  const { db, me } = need();
  const text = body.trim();
  if (!text) throw new Error("Пустое сообщение");
  if (text.length > 2000) throw new Error("Сообщение длиннее 2000 символов");
  const { data, error } = await db
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: me.id, body: text })
    .select(MSELECT)
    .single();
  if (error) throw error;
  return mFromRow(data as MRow);
}

export async function markRead(conversationId: string): Promise<void> {
  const { db, me } = need();
  await db
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", me.id)
    .is("read_at", null);
}

export async function fetchUnreadCount(): Promise<number> {
  const me = getCurrentUser();
  if (!supabase || !me) return 0;
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .neq("sender_id", me.id)
    .is("read_at", null);
  return count ?? 0;
}
