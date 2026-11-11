"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import SiteHeader from "./site-header";
import AuthModal from "./auth-modal";
import { copy, type Copy, type Locale } from "@/lib/i18n";
import { getCurrentUser, USER_EVENT, type User } from "@/lib/store";

export type ShellCtx = {
  t: Copy;
  locale: Locale;
  user: User | null;
  /** True after the first client render, so pages know the user check is done. */
  ready: boolean;
  openAuth: () => void;
};

/**
 * Common frame for pages: header, language and theme, login window.
 * Pages receive the current user through a render function.
 */
export default function PageShell({
  children,
  maxWidth = 1100,
}: {
  children: (ctx: ShellCtx) => ReactNode;
  maxWidth?: number;
}) {
  const [locale, setLocale] = useState<Locale>("uz-Latn");
  const [dark, setDark] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("voosita_locale") as Locale | null;
    if (saved && copy[saved]) setLocale(saved);
    const d = localStorage.getItem("voosita_dark") === "1";
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
    setUser(getCurrentUser());
    setReady(true);
    const sync = () => setUser(getCurrentUser());
    window.addEventListener(USER_EVENT, sync);
    return () => window.removeEventListener(USER_EVENT, sync);
  }, []);

  const openAuth = useCallback(() => setAuthOpen(true), []);
  const t = copy[locale];

  return (
    <div className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SiteHeader
        t={t}
        locale={locale}
        dark={dark}
        user={user}
        onOpenAuth={openAuth}
        onLocaleChange={(l) => {
          setLocale(l);
          localStorage.setItem("voosita_locale", l);
        }}
      />
      <main className="vp-main" style={{ maxWidth }}>
        {children({ t, locale, user, ready, openAuth })}
      </main>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} t={t} locale={locale} />
    </div>
  );
}
