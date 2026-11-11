import { supabase } from "./supabase";
import type { Locale } from "./i18n";
import { sanitizeQuery, safeHttpUrl, UUID_RE } from "./util";
import { removeImage } from "./storage";
import type { ListingStatus } from "./listings";

/* ---------- Ads ---------- */

export type AdSlotId = "home" | "jobs" | "services" | "housing" | "search";

export const AD_SLOTS: { id: AdSlotId; label: string }[] = [
  { id: "home", label: "Главная" },
  { id: "jobs", label: "Работа" },
  { id: "services", label: "Услуги" },
  { id: "housing", label: "Жильё" },
  { id: "search", label: "Поиск" },
];

export type Ad = {
  id: string;
  slot: AdSlotId;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  active: boolean;
  createdAt: string;
};

type AdRow = {
  id: string;
  slot: AdSlotId;
  title: string;
  body: string | null;
  image_url: string | null;
  link_url: string | null;
  active: boolean;
  created_at: string;
};

const ASELECT = "id, slot, title, body, image_url, link_url, active, created_at";

const adFromRow = (r: AdRow): Ad => ({
  id: r.id,
  slot: r.slot,
  title: r.title,
  body: r.body,
  imageUrl: r.image_url,
  linkUrl: safeHttpUrl(r.link_url),
  active: r.active,
  createdAt: r.created_at,
});

/** Active ads for one page slot. */
export async function fetchActiveAds(slot: AdSlotId): Promise<Ad[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ads")
    .select(ASELECT)
    .eq("slot", slot)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return ((data ?? []) as AdRow[]).map(adFromRow);
}

/** All ads, including inactive ones. Only admins can read inactive rows. */
export async function fetchAllAds(): Promise<Ad[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ads")
    .select(ASELECT)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as AdRow[]).map(adFromRow);
}

export type AdInput = {
  slot: AdSlotId;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string;
  active: boolean;
};

function adPayload(i: AdInput) {
  const link = i.linkUrl.trim();
  if (link && !safeHttpUrl(link)) throw new Error("Ссылка должна начинаться с http:// или https://");
  if (!i.title.trim()) throw new Error("Введите заголовок рекламы");
  return {
    slot: i.slot,
    title: i.title.trim(),
    body: i.body.trim() || null,
    image_url: i.imageUrl,
    link_url: link || null,
    active: i.active,
  };
}

export async function createAd(input: AdInput): Promise<void> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase.from("ads").insert(adPayload(input));
  if (error) throw error;
}

export async function updateAd(id: string, input: AdInput): Promise<void> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase.from("ads").update(adPayload(input)).eq("id", id);
  if (error) throw error;
}

export async function setAdActive(id: string, active: boolean): Promise<void> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase.from("ads").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteAd(ad: Ad): Promise<void> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase.from("ads").delete().eq("id", ad.id);
  if (error) throw error;
  if (ad.imageUrl) await removeImage("ads", ad.imageUrl).catch(() => undefined);
}

/* ---------- Site settings (About page, contact email) ---------- */

export const DEFAULT_EMAIL = "partner@voosita.uz";

export const ABOUT_KEY: Record<Locale, string> = {
  "uz-Latn": "about_uz-Latn",
  "uz-Cyrl": "about_uz-Cyrl",
  ru: "about_ru",
};
export const EMAIL_KEY = "partnership_email";

/**
 * Format of the About text, kept simple on purpose:
 *   "# Title"    a heading
 *   "- item"     a list item
 *   a blank line starts a new paragraph
 */
export const ABOUT_DEFAULT: Record<Locale, string> = {
  "uz-Latn": `VOOSITA WORK — O‘zbekiston uchun yagona platforma: ish qidirish, mutaxassis va xizmat topish, uy-joy ijarasi. Barcha asosiy imkoniyatlar bepul.

# Asosiy funksiyalar
- Ro‘yxatdan o‘tish va profil (rasmlar, reyting, sharhlar)
- Ish, xizmat va uy-joy e’lonlari
- Chat: buyurtmachi va ijrochi, ijarachi va uy egasi
- Qo‘llab-quvvatlash: xabarlar administratorga
- 3 til: o‘zbek (lotin va kirill), rus

# Kimlar uchun
Ish izlovchilar, ish beruvchilar, ustalar va mutaxassislar, buyurtmachilar, uy egalari va ijarachilar bitta joyda bog‘lanishadi.

# Hamkorlik
Reklama va hamkorlik bo‘yicha quyidagi manzilga yozing.`,
  "uz-Cyrl": `VOOSITA WORK — Ўзбекистон учун ягона платформа: иш қидириш, мутахассис ва хизмат топиш, уй-жой ижараси. Барча асосий имкониятлар бепул.

# Асосий функциялар
- Рўйхатдан ўтиш ва профил (расмлар, рейтинг, шарҳлар)
- Иш, хизмат ва уй-жой эълонлари
- Чат: буюртмачи ва ижрочи, ижарачи ва уй эгаси
- Қўллаб-қувватлаш: хабарлар администраторга
- 3 тил: ўзбек (лотин ва кирилл), рус

# Кимлар учун
Иш излочилар, иш берувчилар, усталар ва мутахассислар, буюртмачилар, уй эгалари ва ижарачилар битта жойда боғланишади.

# Ҳамкорлик
Реклама ва ҳамкорлик бўйича қуйидаги манзилга ёзинг.`,
  ru: `VOOSITA WORK — единая платформа для Узбекистана: поиск работы, специалистов и услуг, аренда жилья. Все основные возможности бесплатны.

# Основные функции
- Регистрация и профиль (фото, рейтинг, отзывы)
- Объявления о работе, услугах и жилье
- Чат: заказчик и исполнитель, арендатор и владелец
- Поддержка: сообщения администратору
- 3 языка: узбекский (латиница и кириллица), русский

# Для кого
Соискатели, работодатели, мастера и специалисты, заказчики, владельцы жилья и арендаторы находят друг друга в одном месте.

# Сотрудничество
По вопросам рекламы и сотрудничества пишите на адрес ниже.`,
};

export async function fetchSettings(keys: string[]): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from("site_settings").select("key, value").in("key", keys);
  if (error) throw error;
  const out: Record<string, string> = {};
  for (const r of (data ?? []) as { key: string; value: string }[]) out[r.key] = r.value;
  return out;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}

export async function fetchPartnershipEmail(): Promise<string> {
  try {
    const s = await fetchSettings([EMAIL_KEY]);
    return s[EMAIL_KEY] || DEFAULT_EMAIL;
  } catch {
    return DEFAULT_EMAIL;
  }
}

/* ---------- Admin tools ---------- */

export type AdminUser = {
  id: string;
  name: string;
  phone: string | null;
  role: "user" | "admin";
  banned: boolean;
  createdAt: string;
};

export async function adminFetchUsers(text: string): Promise<AdminUser[]> {
  if (!supabase) return [];
  let q = supabase.from("profiles").select("id, name, phone, role, banned, created_at");
  const t = sanitizeQuery(text);
  if (t) q = q.or(`name.ilike.%${t}%,phone.ilike.%${t}%`);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (
    (data ?? []) as {
      id: string;
      name: string;
      phone: string | null;
      role: "user" | "admin";
      banned: boolean;
      created_at: string;
    }[]
  ).map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    role: r.role,
    banned: r.banned,
    createdAt: r.created_at,
  }));
}

export async function adminSetBan(userId: string, banned: boolean): Promise<void> {
  if (!supabase || !UUID_RE.test(userId)) throw new Error("Некорректный пользователь");
  const { error } = await supabase.rpc("admin_set_ban", { target: userId, flag: banned });
  if (error) throw error;
}

export type AdminListing = {
  id: string;
  ownerId: string;
  type: "job" | "service" | "housing";
  title: string;
  status: ListingStatus;
  createdAt: string;
};

export async function adminFetchListings(text: string): Promise<AdminListing[]> {
  if (!supabase) return [];
  let q = supabase.from("listings").select("id, owner_id, type, title, status, created_at");
  const t = sanitizeQuery(text);
  if (t) q = q.ilike("title", `%${t}%`);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (
    (data ?? []) as {
      id: string;
      owner_id: string;
      type: "job" | "service" | "housing";
      title: string;
      status: ListingStatus;
      created_at: string;
    }[]
  ).map((r) => ({
    id: r.id,
    ownerId: r.owner_id,
    type: r.type,
    title: r.title,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export type AdminReport = {
  id: string;
  reporterId: string;
  targetUserId: string | null;
  listingId: string | null;
  reason: string;
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
};

export async function adminFetchReports(onlyOpen: boolean): Promise<AdminReport[]> {
  if (!supabase) return [];
  let q = supabase
    .from("reports")
    .select("id, reporter_id, target_user_id, listing_id, reason, details, status, created_at");
  if (onlyOpen) q = q.eq("status", "open");
  const { data, error } = await q.order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (
    (data ?? []) as {
      id: string;
      reporter_id: string;
      target_user_id: string | null;
      listing_id: string | null;
      reason: string;
      details: string | null;
      status: "open" | "resolved" | "dismissed";
      created_at: string;
    }[]
  ).map((r) => ({
    id: r.id,
    reporterId: r.reporter_id,
    targetUserId: r.target_user_id,
    listingId: r.listing_id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function adminSetReportStatus(id: string, status: "resolved" | "dismissed"): Promise<void> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase.from("reports").update({ status }).eq("id", id);
  if (error) throw error;
}
