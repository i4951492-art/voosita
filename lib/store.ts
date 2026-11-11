/**
 * Auth state. The real data lives in Supabase.
 * getCurrentUser() is a local cache of the signed-in profile for fast rendering.
 * It is NOT a security check: every permission is enforced by the database (RLS).
 */
import { supabase } from "./supabase";

export type Role = "user" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  createdAt: string;
};

const USER_KEY = "voosita_user";
export const USER_EVENT = "voosita:user";

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* storage unavailable */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(USER_EVENT));
}

export const isAdmin = (u: User | null) => u?.role === "admin";

type ProfileRow = {
  id: string;
  name: string;
  phone: string | null;
  role: Role;
  banned: boolean;
  created_at: string;
};

let lastRefreshBanned = false;

/** Reads the Supabase session and refreshes the local cache. */
export async function refreshCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  lastRefreshBanned = false;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) {
    setCurrentUser(null);
    return null;
  }
  const { data: row, error } = await supabase
    .from("profiles")
    .select("id, name, phone, role, banned, created_at")
    .eq("id", session.user.id)
    .single();
  if (error || !row) {
    setCurrentUser(null);
    return null;
  }
  const p = row as ProfileRow;
  if (p.banned) {
    lastRefreshBanned = true;
    await supabase.auth.signOut();
    setCurrentUser(null);
    return null;
  }
  const user: User = {
    id: p.id,
    name: p.name,
    email: session.user.email ?? "",
    phone: p.phone ?? undefined,
    role: p.role,
    createdAt: p.created_at,
  };
  setCurrentUser(user);
  return user;
}

export async function registerUser(data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<{ user: User | null; needsConfirmation: boolean }> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { data: res, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { name: data.name, phone: data.phone ?? null } },
  });
  if (error) throw error;
  if (!res.session) return { user: null, needsConfirmation: true };
  const user = await refreshCurrentUser();
  return { user, needsConfirmation: false };
}

export async function loginUser(email: string, password: string): Promise<User> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const user = await refreshCurrentUser();
  if (!user) throw new Error(lastRefreshBanned ? "BANNED" : "PROFILE_NOT_FOUND");
  return user;
}

export function logoutUser() {
  setCurrentUser(null);
  void supabase?.auth.signOut();
}
