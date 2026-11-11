"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound, Settings, MessageCircle } from "lucide-react";
import type { Copy, Locale } from "@/lib/i18n";
import type { User } from "@/lib/store";
import { fetchUnreadCount } from "@/lib/chat";
import BrandLogo from "./brand-logo";

interface SiteHeaderProps {
  t: Copy;
  locale: Locale;
  dark: boolean;
  user?: User | null;
  onOpenAuth: () => void;
  onLocaleChange: (l: Locale) => void;
}

export default function SiteHeader({ t, locale, dark, user = null, onOpenAuth, onLocaleChange }: SiteHeaderProps) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  // Unread messages badge, refreshed every 30 seconds while the tab is open
  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let alive = true;
    const load = () => {
      if (document.hidden) return;
      fetchUnreadCount()
        .then((n) => alive && setUnread(n))
        .catch(() => undefined);
    };
    load();
    const id = window.setInterval(load, 30000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [user]);

  const nav = [
    { href: "/jobs", label: t.jobsTitle },
    { href: "/services", label: t.servicesTitle },
    { href: "/housing", label: t.housingTitle },
    { href: "/new", label: "Разместить" },
  ];

  const iconBtnStyle = {
    background: dark ? "rgba(255,255,255,0.08)" : "rgba(16,38,74,0.06)",
    border: "1px solid var(--line)",
    color: "var(--text-dark)",
  };

  return (
    <header className="page-header">
      <div className="page-header-inner">
        <Link href="/" className="page-logo" aria-label="VOOSITA WORK">
          <BrandLogo height={32} />
        </Link>

        <nav className="page-nav">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="page-header-actions">
          <div className="lang-switch" style={{ gap: 4 }}>
            {(["uz-Latn", "uz-Cyrl", "ru"] as Locale[]).map((code) => (
              <button
                key={code}
                className={`lang-btn ${locale === code ? "active" : ""}`}
                style={{ padding: "6px 10px", fontSize: 12 }}
                onClick={() => onLocaleChange(code)}
              >
                {code === "uz-Latn" ? "UZ" : code === "uz-Cyrl" ? "ЎЗ" : "RU"}
              </button>
            ))}
          </div>
          <Link
            href="/messages"
            className="pill-btn vp-badge-host"
            style={iconBtnStyle}
            title={t.messages}
            aria-label={t.messages}
          >
            <MessageCircle size={15} />
            {unread > 0 && <span className="vp-badge">{unread > 99 ? "99+" : unread}</span>}
          </Link>
          <Link href="/settings" className="pill-btn" style={iconBtnStyle} title={t.settings} aria-label={t.settings}>
            <Settings size={15} />
          </Link>
          {user ? (
            <Link href="/my-profile" className="pill-btn" style={iconBtnStyle}>
              <UserRound size={15} />
              <span className="vp-hide-xs">{user.name.split(" ")[0]}</span>
            </Link>
          ) : (
            <button className="pill-btn" style={iconBtnStyle} onClick={onOpenAuth}>
              <UserRound size={15} />
              <span>{t.login}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
