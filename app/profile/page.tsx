"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  Camera,
  MapPin,
  Briefcase,
  Award,
  MessageSquare,
  ShieldCheck,
  Heart,
  ChevronLeft,
} from "lucide-react";
import SiteHeader from "@/components/site-header";
import AuthModal from "@/components/auth-modal";
import { copy, type Locale } from "@/lib/i18n";

// Demo profile data (in real app → Supabase)
const DEMO_PROFILE = {
  id: "demo-1",
  name: "Aziz Karimov",
  title: "Frontend dasturchi & UI/UX",
  city: "Toshkent",
  verified: true,
  rating: 4.9,
  reviewsCount: 47,
  completedJobs: 128,
  experienceYears: 6,
  about:
    "6 yildan beri web va mobil interfeyslar yarataman. React, Next.js, TypeScript. Portfolio va real natijalar — pastroqda.",
  skills: ["React", "Next.js", "TypeScript", "Figma", "Tailwind"],
  prices: [
    { label: "Landing page", price: "3 500 000 so‘m" },
    { label: "Admin panel", price: "8 000 000 so‘m" },
    { label: "Konsultatsiya (1 soat)", price: "250 000 so‘m" },
  ],
  portfolio: [
    { title: "E-commerce redesign", desc: "Konversiya +34%", color: "#1674ef" },
    { title: "Banking app UI", desc: "iOS + Android", color: "#079b85" },
    { title: "SaaS dashboard", desc: "B2B product", color: "#4b35db" },
    { title: "Marketplace", desc: "Full redesign", color: "#f39a35" },
  ],
  reviews: [
    {
      author: "Dilnoza M.",
      rating: 5,
      text: "Juda professional ishladi, muddatlarga rioya qildi. Tavsiya qilaman!",
      date: "12 kun oldin",
    },
    {
      author: "Bobur T.",
      rating: 5,
      text: "Kod sifati yuqori, kommunikatsiya zo‘r.",
      date: "1 oy oldin",
    },
    {
      author: "Sevara K.",
      rating: 4,
      text: "Yaxshi natija, lekin biroz kechikdi. Umuman olganda mamnunman.",
      date: "2 oy oldin",
    },
  ],
};

export default function ProfilePage() {
  const [locale, setLocale] = useState<Locale>("uz-Latn");
  const [dark, setDark] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [tab, setTab] = useState<"about" | "portfolio" | "reviews">("about");
  const [newRating, setNewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const t = copy[locale];
  const p = DEMO_PROFILE;

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

  const submitReview = () => {
    if (newRating < 1) {
      alert("Baholashni tanlang (1–5)");
      return;
    }
    alert(
      `Rahmat! Sizning bahoingiz: ${newRating}★\n"${reviewText.slice(0, 80)}..."\n\n${t.comingSoon}`
    );
    setNewRating(0);
    setReviewText("");
  };

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

      <div className="page-content" style={{ maxWidth: 900 }}>
        <Link
          href="/services"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--blue-bright)",
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          <ChevronLeft size={16} /> {t.backHome}
        </Link>

        {/* Profile header */}
        <div
          className="panel"
          style={{
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 20,
              background: "linear-gradient(135deg, #1674ef, #4b35db)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 36,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            AK
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>{p.name}</h1>
              {p.verified && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#079b85",
                    background: "rgba(7,155,133,0.12)",
                    padding: "4px 10px",
                    borderRadius: 20,
                  }}
                >
                  <ShieldCheck size={14} /> Pasport tekshirildi
                </span>
              )}
            </div>
            <p style={{ color: "var(--text-muted)", marginTop: 4 }}>{p.title}</p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                marginTop: 12,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={14} /> {p.city}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={14} fill="#f39a35" color="#f39a35" /> {p.rating} ({p.reviewsCount})
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Briefcase size={14} /> {p.completedJobs} ish
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Award size={14} /> {p.experienceYears} yil
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="auth-submit"
              style={{ width: "auto", padding: "0 20px", height: 42 }}
              onClick={() => alert(t.contact + " — " + t.comingSoon)}
            >
              {t.contact}
            </button>
            <button
              className="btn-ghost"
              style={{ height: 42, padding: "0 14px" }}
              onClick={() => alert("Sevimlilarga qo‘shildi")}
            >
              <Heart size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {(
            [
              ["about", "Haqida"],
              ["portfolio", "Portfolio"],
              ["reviews", `Otzyvlar (${p.reviewsCount})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={`filter-chip ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "about" && (
          <div className="panel">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Haqida</h2>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)", marginBottom: 16 }}>
              {p.about}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {p.skills.map((s) => (
                <span
                  key={s}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "var(--bg-soft)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Narxlar</h3>
            <ul style={{ listStyle: "none" }}>
              {p.prices.map((pr, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: i < p.prices.length - 1 ? "1px solid var(--line)" : "none",
                    fontSize: 14,
                  }}
                >
                  <span>{pr.label}</span>
                  <span style={{ fontWeight: 700, color: "var(--blue-bright)" }}>{pr.price}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "portfolio" && (
          <div className="cards-grid">
            {p.portfolio.map((item, i) => (
              <div key={i} className="item-card">
                <div
                  style={{
                    height: 120,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${item.color}, ${item.color}99)`,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 28,
                  }}
                >
                  <Camera size={32} />
                </div>
                <h3>{item.title}</h3>
                <div className="meta">{item.desc}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "reviews" && (
          <div>
            {/* Leave review */}
            <div className="panel" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Baholash va otzyv qoldirish
              </h3>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNewRating(n)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  >
                    <Star
                      size={28}
                      fill={n <= newRating ? "#f39a35" : "transparent"}
                      color={n <= newRating ? "#f39a35" : "var(--text-muted)"}
                    />
                  </button>
                ))}
              </div>
              <textarea
                className="auth-input"
                style={{ height: 90, padding: 12, resize: "vertical" }}
                placeholder="Ish haqida yozing..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
              <button
                className="auth-submit"
                style={{ marginTop: 10, width: "auto", padding: "0 24px" }}
                onClick={submitReview}
              >
                Yuborish
              </button>
            </div>

            {p.reviews.map((r, i) => (
              <div key={i} className="panel" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>{r.author}</strong>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.date}</span>
                </div>
                <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      fill={n <= r.rating ? "#f39a35" : "transparent"}
                      color={n <= r.rating ? "#f39a35" : "var(--text-muted)"}
                    />
                  ))}
                </div>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>{r.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} t={t} locale={locale} />
    </main>
  );
}
