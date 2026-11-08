"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "./site-header";
import AuthModal from "./auth-modal";
import { copy, type Locale } from "@/lib/i18n";

interface Item {
  title: string;
  meta: string;
  price: string;
}

interface SectionPageProps {
  type: "jobs" | "services" | "housing";
  items: Item[];
}

export default function SectionPage({ type, items }: SectionPageProps) {
  const [locale, setLocale] = useState<Locale>("uz-Latn");
  const [dark, setDark] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const t = copy[locale];

  useEffect(() => {
    const savedLocale = localStorage.getItem("voosita-locale") as Locale | null;
    const savedDark = localStorage.getItem("voosita-dark") === "1";
    if (savedLocale && copy[savedLocale]) setLocale(savedLocale);
    if (savedDark) setDark(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("voosita-locale", locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem("voosita-dark", dark ? "1" : "0");
  }, [dark]);

  const titles = {
    jobs: t.jobsTitle,
    services: t.servicesTitle,
    housing: t.housingTitle,
  };
  const subtitles = {
    jobs: t.jobsSubtitle,
    services: t.servicesSubtitle,
    housing: t.housingSubtitle,
  };

  const filters =
    type === "jobs"
      ? ["all", "IT", "Marketing", "Sales"]
      : type === "services"
      ? ["all", "Usta", "IT", "Tutor", "Transport"]
      : ["all", "1", "2", "3+"];

  return (
    <main className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SiteHeader
        t={t}
        locale={locale}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onOpenAuth={() => setAuthOpen(true)}
        onLocaleChange={setLocale}
      />

      <div className="page-content">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Link href="/" style={{ fontSize: 13, color: "var(--blue-bright)", fontWeight: 600 }}>
            ← {t.backHome}
          </Link>
        </div>
        <h1 className="page-title">{titles[type]}</h1>
        <p className="page-subtitle">{subtitles[type]}</p>

        <div className="filters">
          {filters.map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? t.all : f}
            </button>
          ))}
        </div>

        <div className="cards-grid">
          {items.map((item, i) => (
            <div key={i} className="item-card">
              <h3>{item.title}</h3>
              <div className="meta">{item.meta}</div>
              <div className="price">{item.price}</div>
              <div className="actions">
                <button
                  className="btn-primary"
                  onClick={() =>
                    alert(
                      `${type === "jobs" ? t.apply : t.contact}: ${item.title} — ${t.comingSoon}`
                    )
                  }
                >
                  {type === "jobs" ? t.apply : t.contact}
                </button>
                <button className="btn-ghost" onClick={() => alert(t.comingSoon)}>
                  ···
                </button>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="empty-state">{t.comingSoon}</div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} t={t} locale={locale} />
    </main>
  );
}
