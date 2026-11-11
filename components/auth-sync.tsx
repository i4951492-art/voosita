"use client";

import { useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { refreshCurrentUser, setCurrentUser } from "@/lib/store";

/** Keeps the local user cache in sync with the Supabase session on every page. */
export default function AuthSync() {
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    void refreshCurrentUser();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setCurrentUser(null);
      else void refreshCurrentUser();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
