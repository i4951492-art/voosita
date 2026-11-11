import { supabase } from "./supabase";
import { getCurrentUser } from "./store";

export const GOALS = [
  { id: "job_seeker", label: "Ищу работу" },
  { id: "employer", label: "Ищу сотрудников" },
  { id: "service_provider", label: "Предлагаю услуги" },
  { id: "service_client", label: "Ищу специалиста" },
  { id: "renter", label: "Ищу жильё в аренду" },
  { id: "landlord", label: "Сдаю жильё" },
] as const;

export type Goal = (typeof GOALS)[number]["id"];

export type Profile = {
  name: string;
  phone: string;
  city: string;
  bio: string;
  goals: Goal[];
  skills: string[];
  experienceYears: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  photoUrls: string[];
  isPublic: boolean;
};

export const EMPTY_PROFILE: Profile = {
  name: "",
  phone: "",
  city: "",
  bio: "",
  goals: [],
  skills: [],
  experienceYears: null,
  priceFrom: null,
  priceTo: null,
  photoUrls: [],
  isPublic: true,
};

const BUCKET = "profile-photos";
const SELECT =
  "name, phone, city, bio, goals, skills, experience_years, price_from, price_to, photo_urls, is_public";

type Row = {
  name: string;
  phone: string | null;
  city: string | null;
  bio: string | null;
  goals: string[] | null;
  skills: string[] | null;
  experience_years: number | null;
  price_from: number | null;
  price_to: number | null;
  photo_urls: string[] | null;
  is_public: boolean;
};

function fromRow(r: Row): Profile {
  return {
    name: r.name ?? "",
    phone: r.phone ?? "",
    city: r.city ?? "",
    bio: r.bio ?? "",
    goals: (r.goals ?? []).filter((g): g is Goal => GOALS.some((x) => x.id === g)),
    skills: r.skills ?? [],
    experienceYears: r.experience_years,
    priceFrom: r.price_from,
    priceTo: r.price_to,
    photoUrls: r.photo_urls ?? [],
    isPublic: r.is_public,
  };
}

function requireUser() {
  const me = getCurrentUser();
  if (!supabase || !me) throw new Error("NOT_LOGGED_IN");
  return { db: supabase, me };
}

export async function fetchMyProfile(): Promise<Profile | null> {
  if (!supabase || !getCurrentUser()) return null;
  const { db, me } = requireUser();
  const { data, error } = await db.from("profiles").select(SELECT).eq("id", me.id).single();
  if (error || !data) throw new Error(error?.message ?? "PROFILE_NOT_FOUND");
  return fromRow(data as Row);
}

export async function saveMyProfile(p: Profile): Promise<void> {
  const { db, me } = requireUser();
  const { error } = await db
    .from("profiles")
    .update({
      name: p.name.trim(),
      phone: p.phone.trim() || null,
      city: p.city.trim() || null,
      bio: p.bio.trim() || null,
      goals: p.goals,
      skills: p.skills,
      experience_years: p.experienceYears,
      price_from: p.priceFrom,
      price_to: p.priceTo,
      photo_urls: p.photoUrls,
      is_public: p.isPublic,
      updated_at: new Date().toISOString(),
    })
    .eq("id", me.id);
  if (error) throw error;
}

export async function uploadPhoto(file: File): Promise<string> {
  const { db, me } = requireUser();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${me.id}/${Date.now()}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removePhoto(url: string): Promise<void> {
  const { db } = requireUser();
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(url.slice(idx + marker.length));
  await db.storage.from(BUCKET).remove([path]);
}
