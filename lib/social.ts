import { supabase } from "./supabase";
import { getCurrentUser } from "./store";
import { sanitizeQuery, UUID_RE } from "./util";

/* ---------- Public profiles (safe columns only, no phone) ---------- */

export type PublicProfile = {
  id: string;
  name: string;
  city: string | null;
  bio: string | null;
  goals: string[];
  skills: string[];
  experienceYears: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  photoUrls: string[];
  isPublic: boolean;
  createdAt: string;
  ratingAvg: number;
  reviewsCount: number;
};

type PRow = {
  id: string;
  name: string;
  city: string | null;
  bio: string | null;
  goals: string[] | null;
  skills: string[] | null;
  experience_years: number | null;
  price_from: number | null;
  price_to: number | null;
  photo_urls: string[] | null;
  is_public: boolean;
  created_at: string;
  rating_avg: number | string | null;
  reviews_count: number | null;
};

const PSELECT =
  "id, name, city, bio, goals, skills, experience_years, price_from, price_to, photo_urls, is_public, created_at, rating_avg, reviews_count";

function pFromRow(r: PRow): PublicProfile {
  return {
    id: r.id,
    name: r.name,
    city: r.city,
    bio: r.bio,
    goals: r.goals ?? [],
    skills: r.skills ?? [],
    experienceYears: r.experience_years,
    priceFrom: r.price_from === null ? null : Number(r.price_from),
    priceTo: r.price_to === null ? null : Number(r.price_to),
    photoUrls: r.photo_urls ?? [],
    isPublic: r.is_public,
    createdAt: r.created_at,
    ratingAvg: Number(r.rating_avg ?? 0),
    reviewsCount: r.reviews_count ?? 0,
  };
}

export async function fetchPublicProfiles(ids: string[]): Promise<Record<string, PublicProfile>> {
  const unique = Array.from(new Set(ids)).filter((i) => UUID_RE.test(i));
  if (!supabase || unique.length === 0) return {};
  const { data, error } = await supabase.from("public_profiles").select(PSELECT).in("id", unique);
  if (error) throw error;
  const map: Record<string, PublicProfile> = {};
  for (const r of (data ?? []) as PRow[]) map[r.id] = pFromRow(r);
  return map;
}

export async function fetchPublicProfile(id: string): Promise<PublicProfile | null> {
  if (!UUID_RE.test(id)) return null;
  const map = await fetchPublicProfiles([id]);
  return map[id] ?? null;
}

/** People who offer services, for the search page. */
export async function searchSpecialists(text: string, limit = 12): Promise<PublicProfile[]> {
  if (!supabase) return [];
  let q = supabase
    .from("public_profiles")
    .select(PSELECT)
    .eq("is_public", true)
    .contains("goals", ["service_provider"]);
  const t = sanitizeQuery(text);
  if (t) q = q.or(`name.ilike.%${t}%,bio.ilike.%${t}%,city.ilike.%${t}%`);
  const { data, error } = await q.order("rating_avg", { ascending: false }).limit(limit);
  if (error) throw error;
  return ((data ?? []) as PRow[]).map(pFromRow);
}

/* ---------- Reviews ---------- */

export type Review = {
  id: string;
  authorId: string;
  targetId: string;
  rating: number;
  body: string | null;
  createdAt: string;
};

type RRow = {
  id: string;
  author_id: string;
  target_id: string;
  rating: number;
  body: string | null;
  created_at: string;
};

const rFromRow = (r: RRow): Review => ({
  id: r.id,
  authorId: r.author_id,
  targetId: r.target_id,
  rating: r.rating,
  body: r.body,
  createdAt: r.created_at,
});

export async function fetchReviews(targetId: string): Promise<Review[]> {
  if (!supabase || !UUID_RE.test(targetId)) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("id, author_id, target_id, rating, body, created_at")
    .eq("target_id", targetId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return ((data ?? []) as RRow[]).map(rFromRow);
}

/** A review is allowed only after the two people have chatted (enforced by the database too). */
export async function hasChatWith(otherId: string): Promise<boolean> {
  const me = getCurrentUser();
  if (!supabase || !me || !UUID_RE.test(otherId)) return false;
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("kind", "direct")
    .or(`and(user_a.eq.${me.id},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${me.id})`)
    .limit(1);
  return Boolean(data && data.length > 0);
}

export async function saveReview(targetId: string, rating: number, body: string): Promise<void> {
  const me = getCurrentUser();
  if (!supabase || !me) throw new Error("NOT_LOGGED_IN");
  if (rating < 1 || rating > 5) throw new Error("Поставьте оценку от 1 до 5");
  const text = body.trim().slice(0, 1000) || null;
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("author_id", me.id)
    .eq("target_id", targetId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("reviews")
      .update({ rating, body: text, updated_at: new Date().toISOString() })
      .eq("id", (existing as { id: string }).id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("reviews")
      .insert({ author_id: me.id, target_id: targetId, rating, body: text });
    if (error) throw error;
  }
}

export async function deleteReview(id: string): Promise<void> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Blocks ---------- */

export async function isBlockedByMe(userId: string): Promise<boolean> {
  const me = getCurrentUser();
  if (!supabase || !me) return false;
  const { data } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", me.id)
    .eq("blocked_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function setBlocked(userId: string, on: boolean): Promise<void> {
  const me = getCurrentUser();
  if (!supabase || !me) throw new Error("NOT_LOGGED_IN");
  if (on) {
    const { error } = await supabase.from("blocks").insert({ blocker_id: me.id, blocked_id: userId });
    if (error && !String(error.message).includes("duplicate")) throw error;
  } else {
    const { error } = await supabase.from("blocks").delete().eq("blocker_id", me.id).eq("blocked_id", userId);
    if (error) throw error;
  }
}

/* ---------- Reports ---------- */

export const REPORT_REASONS = [
  { id: "spam", label: "Спам или реклама" },
  { id: "fraud", label: "Мошенничество" },
  { id: "abuse", label: "Оскорбления" },
  { id: "fake", label: "Ложная информация" },
  { id: "other", label: "Другое" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["id"];

export async function submitReport(input: {
  targetUserId?: string;
  listingId?: string;
  reason: ReportReason;
  details: string;
}): Promise<void> {
  const me = getCurrentUser();
  if (!supabase || !me) throw new Error("NOT_LOGGED_IN");
  const { error } = await supabase.from("reports").insert({
    reporter_id: me.id,
    target_user_id: input.targetUserId ?? null,
    listing_id: input.listingId ?? null,
    reason: input.reason,
    details: input.details.trim().slice(0, 1000) || null,
  });
  if (error) throw error;
}
