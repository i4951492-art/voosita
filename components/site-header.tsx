"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import type { Copy, Locale } from "@/lib/i18n";

interface SiteHeaderProps {
  t: Copy;
  locale: Locale;
  dark: boolean;
  onOpenAuth: () => void;
  onLocaleChange: (l: Locale) => void;
}

export default function SiteHeader({
  t,
  locale,
  dark,
  onOpenAuth,
  onLocaleChange,
}: SiteHeaderProps) {
  const pathname = usePathname();

  const nav = [
    { href: "/jobs", label: t.jobsTitle },
    { href: "/services", label: t.servicesTitle },
    { href: "/housing", label: t.housingTitle },
    { href: "/pricing", label: "Tariflar" },
  ];

  return (
    <header className="page-header">
      <div className="page-header-inner">
        <Link href="/" className="page-logo">
          <div className="logo-v">V</div>
          <span>VOOSITA</span>
        </Link>

        <nav className="page-nav">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
          <button
            className="pill-btn"
            style={{
              background: dark ? "rgba(255,255,255,0.08)" : "rgba(16,38,74,0.06)",
              color: "var(--text-dark)",
              border: "1px solid var(--line)",
            }}
            onClick={onOpenAuth}
          >
            <UserRound size={15} />
            {t.login}
          </button>
        </div>
      </div>
    </header>
  );
}
