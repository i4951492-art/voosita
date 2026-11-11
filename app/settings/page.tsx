"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import AuthModal from "@/components/auth-modal";
import { copy, type Locale } from "@/lib/i18n";
import { getCurrentUser, logoutUser, USER_EVENT, type User } from "@/lib/store";
import { Moon, Sun, Globe, MessageCircle, Shield, LogOut, ChevronLeft, UserRound, ListChecks, Heart, Plus } from "lucide-react";

export default function SettingsPage() {
  const [locale, setLocale] = useState<Locale>("uz-Latn");
  const [dark, setDark] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const t = copy[locale];

  useEffect(() => {
    const saved = localStorage.getItem("voosita_locale") as Locale | null;
    if (saved && copy[saved]) setLocale(saved);
    const d = localStorage.getItem("voosita_dark") === "1";
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
    setUser(getCurrentUser());
    const sync = () => setUser(getCurrentUser());
    window.addEventListener(USER_EVENT, sync);
    return () => window.removeEventListener(USER_EVENT, sync);
  }, []);

  const changeLocale = (l: Locale) => {
    setLocale(l);
    localStorage.setItem("voosita_locale", l);
  };

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("voosita_dark", next ? "1" : "0");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <div className={dark ? "dark" : ""}>
      <SiteHeader
        t={t}
        locale={locale}
        dark={dark}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onLocaleChange={changeLocale}
      />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 80px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--blue)", fontWeight: 600, marginBottom: 16 }}>
          <ChevronLeft size={16} /> {t.backHome}
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{t.settings}</h1>
        <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: 14 }}>
          Til, tema, qo‘llab-quvvatlash · Язык, тема, поддержка
        </p>

        <section className="settings-card">
          <div className="settings-row">
            <div className="settings-label"><Globe size={18} /> {t.language}</div>
            <div className="lang-switch">
              {(["uz-Latn", "uz-Cyrl", "ru"] as Locale[]).map((code) => (
                <button
                  key={code}
                  className={`lang-btn ${locale === code ? "active" : ""}`}
                  onClick={() => changeLocale(code)}
                >
                  {code === "uz-Latn" ? "UZ" : code === "uz-Cyrl" ? "ЎЗ" : "RU"}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-label">
              {dark ? <Moon size={18} /> : <Sun size={18} />} {t.theme}
            </div>
            <button className="pill-btn" onClick={toggleDark} style={{ border: "1px solid var(--line)" }}>
              {dark ? "Light" : "Dark"}
            </button>
          </div>

          {user && (
            <>
              <Link href="/my-profile" className="settings-row link-row">
                <div className="settings-label"><UserRound size={18} /> Мой профиль</div>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Анкета</span>
              </Link>
              <Link href="/my-listings" className="settings-row link-row">
                <div className="settings-label"><ListChecks size={18} /> Мои объявления</div>
              </Link>
              <Link href="/favorites" className="settings-row link-row">
                <div className="settings-label"><Heart size={18} /> Избранное</div>
              </Link>
            </>
          )}

          <Link href="/new" className="settings-row link-row">
            <div className="settings-label"><Plus size={18} /> Разместить объявление</div>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>Бесплатно</span>
          </Link>

          <Link href="/support" className="settings-row link-row">
            <div className="settings-label"><MessageCircle size={18} /> Support 24/7</div>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>Чат с админом</span>
          </Link>

          <Link href="/messages" className="settings-row link-row">
            <div className="settings-label"><MessageCircle size={18} /> Xabarlar / Сообщения</div>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>Chat</span>
          </Link>

          <Link href="/about" className="settings-row link-row">
            <div className="settings-label"><Shield size={18} /> {t.about}</div>
          </Link>

          {user?.role === "admin" && (
            <Link href="/admin" className="settings-row link-row">
              <div className="settings-label"><Shield size={18} /> Admin panel</div>
            </Link>
          )}

          <div className="settings-row">
            <div className="settings-label">
              <LogOut size={18} /> {user ? user.name : t.login}
            </div>
            {user ? (
              <button
                className="pill-btn"
                onClick={() => {
                  logoutUser();
                  setUser(null);
                }}
              >
                Chiqish
              </button>
            ) : (
              <button className="pill-btn" style={{ background: "var(--blue)", color: "#fff" }} onClick={() => setAuthOpen(true)}>
                {t.login}
              </button>
            )}
          </div>
        </section>

        <p style={{ marginTop: 24, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
          VOOSITA WORK — barcha xizmatlar bepul
        </p>
      </main>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} t={t} onAuth={() => setUser(getCurrentUser())} />
      <style jsx global>{`
        .settings-card {
          background: var(--card, #fff);
          border: 1px solid var(--line);
          border-radius: 16px;
          overflow: hidden;
        }
        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--line);
        }
        .settings-row:last-child { border-bottom: none; }
        .settings-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 14px;
        }
        .link-row { text-decoration: none; color: inherit; }
        .link-row:hover { background: rgba(22,116,239,0.04); }
      `}</style>
    </div>
  );
}
