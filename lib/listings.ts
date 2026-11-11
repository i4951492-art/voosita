import { supabase } from "./supabase";
import { getCurrentUser } from "./store";
import { sanitizeQuery } from "./util";

export type ListingType = "job" | "service" | "housing";
export type ListingStatus = "active" | "hidden" | "removed";
export type Deal = "rent" | "sale";

export type Listing = {
  id: string;
  ownerId: string;
  type: ListingType;
  category: string | null;
  title: string;
  description: string | null;
  city: string | null;
  price: number | null;
  rooms: number | null;
  deal: Deal | null;
  photoUrls: string[];
  status: ListingStatus;
  createdAt: string;
};

export const TYPE_META: Record<ListingType, { label: string; path: string; priceLabel: string }> = {
  job: { label: "Работа", path: "/jobs", priceLabel: "Зарплата, сум в месяц" },
  service: { label: "Услуги", path: "/services", priceLabel: "Цена от, сум" },
  housing: { label: "Жильё", path: "/housing", priceLabel: "Цена, сум" },
};

export const CATEGORIES: Record<ListingType, string[]> = {
  job: ["IT", "Маркетинг", "Продажи", "Строительство", "Образование", "Транспорт и логистика", "Общепит", "Другое"],
  service: ["Ремонт и строительство", "IT и дизайн", "Репетиторы", "Транспорт", "Красота и здоровье", "Уборка", "Другое"],
  housing: ["Квартира", "Дом", "Комната", "Коммерческая недвижимость"],
};

export const DEAL_LABEL: Record<Deal, string> = { rent: "Аренда", sale: "Продажа" };

export const MAX_LISTING_PHOTOS = 6;

type Row = {
  id: string;
  owner_id: string;
  type: ListingType;
  category: string | null;
  title: string;
  description: string | null;
  city: string | null;
  price: number | null;
  rooms: number | null;
  deal: Deal | null;
  photo_urls: string[] | null;
  status: ListingStatus;
  created_at: string;
};

const SELECT =
  "id, owner_id, type, category, title, description, city, price, rooms, deal, photo_urls, status, created_at";

function fromRow(r: Row): Listing {
  return {
    id: r.id,
    ownerId: r.owner_id,
    type: r.type,
    category: r.category,
    title: r.title,
    description: r.description,
    city: r.city,
    price: r.price === null ? null : Number(r.price),
    rooms: r.rooms,
    deal: r.deal,
    photoUrls: r.photo_urls ?? [],
    status: r.status,
    createdAt: r.created_at,
  };
}

export function formatPrice(l: Pick<Listing, "price" | "type" | "deal">): string {
  if (l.price === null) return "Договорная";
  const n = l.price.toLocaleString("ru-RU");
  if (l.type === "job") return `${n} сум/мес`;
  if (l.type === "housing" && l.deal === "rent") return `${n} сум/мес`;
  if (l.type === "service") return `от ${n} сум`;
  return `${n} сум`;
}

export type ListingQuery = {
  type?: ListingType;
  q?: string;
  city?: string;
  category?: string;
  deal?: Deal;
  priceMin?: number;
  priceMax?: number;
  ownerId?: string;
  sort?: "new" | "price_asc" | "price_desc";
  limit?: number;
  offset?: number;
};

export async function fetchListings(o: ListingQuery = {}): Promise<Listing[]> {
  if (!supabase) return [];
  let q = supabase.from("listings").select(SELECT).eq("status", "active");
  if (o.type) q = q.eq("type", o.type);
  if (o.ownerId) q = q.eq("owner_id", o.ownerId);
  if (o.category) q = q.eq("category", o.category);
  if (o.deal) q = q.eq("deal", o.deal);
  const city = sanitizeQuery(o.city ?? "");
  if (city) q = q.ilike("city", `%${city}%`);
  const text = sanitizeQuery(o.q ?? "");
  if (text) q = q.or(`title.ilike.%${text}%,description.ilike.%${text}%,city.ilike.%${text}%`);
  if (o.priceMin !== undefined) q = q.gte("price", o.priceMin);
  if (o.priceMax !== undefined) q = q.lte("price", o.priceMax);
  if (o.sort === "price_asc") q = q.order("price", { ascending: true, nullsFirst: false });
  else if (o.sort === "price_desc") q = q.order("price", { ascending: false, nullsFirst: false });
  else q = q.order("created_at", { ascending: false });
  const limit = o.limit ?? 24;
  const from = o.offset ?? 0;
  const { data, error } = await q.range(from, from + limit - 1);
  if (error) throw error;
  return ((data ?? []) as Row[]).map(fromRow);
}

export async function fetchListing(id: string): Promise<Listing | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("listings").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as Row) : null;
}

export async function fetchMyListings(): Promise<Listing[]> {
  const me = getCurrentUser();
  if (!supabase || !me) return [];
  const { data, error } = await supabase
    .from("listings")
    .select(SELECT)
    .eq("owner_id", me.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(fromRow);
}

export type ListingInput = {
  type: ListingType;
  category: string;
  title: string;
  description: string;
  city: string;
  price: number | null;
  rooms: number | null;
  deal: Deal | null;
  photoUrls: string[];
  status: "active" | "hidden";
};

export async function createListing(input: ListingInput): Promise<string> {
  const me = getCurrentUser();
  if (!supabase || !me) throw new Error("NOT_LOGGED_IN");
  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_id: me.id,
      type: input.type,
      category: input.category || null,
      title: input.title.trim(),
      description: input.description.trim() || null,
      city: input.city.trim() || null,
      price: input.price,
      rooms: input.type === "housing" ? input.rooms : null,
      deal: input.type === "housing" ? input.deal : null,
      photo_urls: input.photoUrls,
      status: input.status,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateListing(id: string, input: ListingInput): Promise<void> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase
    .from("listings")
    .update({
      category: input.category || null,
      title: input.title.trim(),
      description: input.description.trim() || null,
      city: input.city.trim() || null,
      price: input.price,
      rooms: input.type === "housing" ? input.rooms : null,
      deal: input.type === "housing" ? input.deal : null,
      photo_urls: input.photoUrls,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function setListingStatus(id: string, status: ListingStatus): Promise<void> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase
    .from("listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteListing(id: string): Promise<void> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Favorites ---------- */

export async function fetchFavoriteIds(): Promise<string[]> {
  const me = getCurrentUser();
  if (!supabase || !me) return [];
  const { data, error } = await supabase.from("favorites").select("listing_id").eq("user_id", me.id);
  if (error) throw error;
  return ((data ?? []) as { listing_id: string }[]).map((r) => r.listing_id);
}

export async function fetchFavoriteListings(): Promise<Listing[]> {
  const ids = await fetchFavoriteIds();
  if (!supabase || ids.length === 0) return [];
  const { data, error } = await supabase
    .from("listings")
    .select(SELECT)
    .in("id", ids)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(fromRow);
}

export async function setFavorite(listingId: string, on: boolean): Promise<void> {
  const me = getCurrentUser();
  if (!supabase || !me) throw new Error("NOT_LOGGED_IN");
  if (on) {
    const { error } = await supabase.from("favorites").insert({ user_id: me.id, listing_id: listingId });
    if (error && !String(error.message).includes("duplicate")) throw error;
  } else {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", me.id)
      .eq("listing_id", listingId);
    if (error) throw error;
  }
}
