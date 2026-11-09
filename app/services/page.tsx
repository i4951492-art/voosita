"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/site-header";
import AuthModal from "@/components/auth-modal";
import { copy, type Locale } from "@/lib/i18n";

const specialists = [
  {
    id: "1",
    name: "Aziz Karimov",
    title: "Frontend dasturchi",
    city: "Toshkent",
    rating: 4.9,
    reviews: 47,
    price: "dan 3 500 000 so‘m",
    verified: true,
    tags: ["React", "Next.js"],
  },
  {
    id: "2",
    name: "Madina Yusupova",
    title: "Ingliz tili repetitori",
    city: "Toshkent",
    rating: 4.8,
    reviews: 112,
    price: "120 000 so‘m / soat",
    verified: true,
    tags: ["IELTS", "General"],
  },
  {
    id: "3",
    name: "Jasur Rahimov",
    title: "Santexnik va elektrchi",
    city: "Toshkent",
    rating: 4.7,
    reviews: 89,
    price: "dan 150 000 so‘m",
    verified: true,
    tags: ["Usta", "Tezkor"],
  },
  {
    id: "4",
    name: "Nilufar Alieva",
    title: "SMM va kontent",
    city: "Samarqand",
    rating: 4.6,
    reviews: 34,
    price: "dan 2 000 000 so‘m",
    verified: false,
    tags: ["Instagram", "Telegram"],
  },
  {
    id: "5",
    name: "Bekzod Toshmatov",
    title: "Yuk tashish (gazel)",
    city: "Toshkent",
    rating: 4.5,
    reviews: 56,
    price: "dan 80 000 so‘m",
    verified: true,
    tags: ["Transport"],
  },
  {
    id: "6",
    name: "Dilshod Norov",
    title: "UI/UX dizayner",
    city: "Toshkent",
    rating: 4.9,
    reviews: 28,
    price: "dan 4 000 000 so‘m",
    verified: true,
    tags: ["Figma", "Mobile"],
  },
];

export default function ServicesPage() {
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
  useEffect(() => localStorage.setItem("voosita-locale", locale), [locale]);
  useEffect(() => localStorage.setItem("voosita-dark", dark ? "1" : "0"), [dark]);

  const filters = ["all", "IT", "Tutor", "Usta", "Transport", "SMM"];

  const filtered =
    filter === "all"
      ? specialists
      : specialists.filter((s) =>
          s.tags.some((tag) => tag.toLowerCase().includes(filter.toLowerCase())) ||
          s.title.toLowerCase().includes(filter.toLowerCase())
        );

  return (
    <main className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SiteHeader
        t={t}
        locale={locale}
        dark={dark}
        onOpenAuth={() => setAuthOpen(true)}
        onLocaleChange={setLocale}
      />

      <div className="page-content">
        <Link href="/" style={{ fontSize: 13, color: "var(--blue-bright)", fontWeight: 600 }}>
          ← {t.backHome}
        </Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>
          {t.servicesTitle}
        </h1>
        <p className="page-subtitle">{t.servicesSubtitle}</p>

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
          {filtered.map((s) => (
            <Link key={s.id} href="/profile" className="item-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {s.name}
                    {s.verified && <ShieldCheck size={14} color="#079b85" />}
                  </h3>
                  <div className="meta">{s.title} · {s.city}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 700 }}>
                  <Star size={14} fill="#f39a35" color="#f39a35" /> {s.rating}
                </div>
              </div>
              <div className="meta" style={{ marginTop: 6 }}>
                {s.reviews} otzyv
              </div>
              <div className="price" style={{ marginTop: 8 }}>{s.price}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "var(--bg-soft)",
                      fontWeight: 600,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} t={t} locale={locale} />
    </main>
  );
}
