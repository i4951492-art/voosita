"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserRound,
  ChevronDown,
  Settings,
  Search,
  BriefcaseBusiness,
  Users,
  House,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Code2,
  GraduationCap,
  Car,
  Heart,
  Moon,
  Sun,
} from "lucide-react";
import { copy, type Locale } from "@/lib/i18n";
import AdBanner from "./ad-banner";
import BrandLogo from "./brand-logo";
import AuthModal from "./auth-modal";
import { fetchListings, formatPrice, type Listing } from "@/lib/listings";
import { getCurrentUser, USER_EVENT, type User } from "@/lib/store";

const SLIDES = ["samarkand", "bukhara", "mountains", "tashkent"] as const;

const CARD_LINKS = ["/jobs", "/services", "/housing", "/housing"];

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("uz-Latn");
  const [dark, setDark] = useState(false);
  const [slide, setSlide] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Listing[]>([]);
  const [homes, setHomes] = useState<Listing[]>([]);
  const router = useRouter();

  const t = copy[locale];

  useEffect(() => {
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const savedLocale = localStorage.getItem("voosita_locale") as Locale | null;
    const savedDark = localStorage.getItem("voosita_dark") === "1";
    if (savedLocale && copy[savedLocale]) setLocale(savedLocale);
    if (savedDark) setDark(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("voosita_locale", locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem("voosita_dark", dark ? "1" : "0");
  }, [dark]);

  useEffect(() => {
    setUser(getCurrentUser());
    const sync = () => setUser(getCurrentUser());
    window.addEventListener(USER_EVENT, sync);
    fetchListings({ type: "job", limit: 3 }).then(setJobs).catch(() => undefined);
    fetchListings({ type: "housing", limit: 2 }).then(setHomes).catch(() => undefined);
    return () => window.removeEventListener(USER_EVENT, sync);
  }, []);

  const goSearch = () => {
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const nextSlide = useCallback(() => {
    setSlide((s) => (s + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const serviceIcons = [
    { Icon: BriefcaseBusiness, cls: "blue" },
    { Icon: Users, cls: "teal" },
    { Icon: House, cls: "purple" },
    { Icon: KeyRound, cls: "orange" },
  ];

  const serviceListIcons = [Wrench, Code2, GraduationCap, Car];

  return (
    <main className={dark ? "dark" : ""}>
      {/* Hero */}
      <section className="hero">
        <div className="hero-slides">
          {SLIDES.map((name, i) => (
            <div
              key={name}
              className={`hero-slide ${name} ${i === slide ? "active" : ""}`}
            />
          ))}
        </div>
        <div className="hero-shade" />

        <div className="hero-content">
          <div className="topbar">
            <div className="topbar-left">
              <button
                className="pill-btn"
                onClick={() => (user ? router.push("/my-profile") : setAuthOpen(true))}
              >
                <UserRound size={16} />
                {user ? user.name.split(" ")[0] : t.profile}
                <ChevronDown size={14} />
              </button>
            </div>

            <div className="logo">
              <BrandLogo height={46} />
            </div>

            <div className="topbar-right">
              <Link href="/settings" className="pill-btn">
                <Settings size={16} />
                {t.settings}
                <ChevronDown size={14} />
              </Link>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 12,
              marginBottom: 8,
            }}
          >
            <div className="search-bar">
              <input
                type="text"
                placeholder={t.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goSearch();
                }}
              />
              <button className="search-btn" onClick={goSearch} aria-label="Search">
                <Search size={20} />
              </button>
            </div>
          </div>

          <div className="hero-center">
            <h1>{t.headline}</h1>
            <p className="subtitle">{t.subtitle}</p>

            <div className="service-grid">
              {t.cards.map(([title, sub], i) => {
                const { Icon, cls } = serviceIcons[i];
                return (
                  <Link key={i} href={CARD_LINKS[i]} className="service-card">
                    <div className={`icon-wrap ${cls}`}>
                      <Icon size={20} />
                    </div>
                    <h3>{title}</h3>
                    <p>{sub}</p>
                    <span className="arrow">
                      <ChevronRight size={14} />
                    </span>
                  </Link>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/about" className="about-btn">
                {t.about}
              </Link>
              <Link href="/new" className="about-btn">
                Разместить объявление
              </Link>
            </div>
          </div>
        </div>

        <div className="slide-controls">
          <button className="slide-btn" onClick={prevSlide} aria-label="Prev">
            <ChevronLeft size={18} />
          </button>
          <div className="dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === slide ? "active" : ""}`}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
          <button className="slide-btn" onClick={nextSlide} aria-label="Next">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="photo-note">{t.photoNote}</div>
      </section>

      {/* Dashboard */}
      <div className="vp-home-ad">
        <AdBanner slot="home" />
      </div>

      <section className="dashboard">
        <div className="panel">
          <div className="panel-header">
            <h2>{t.popular}</h2>
            <Link href="/services" className="link">
              {t.all}
            </Link>
          </div>
          <ul className="service-list">
            {t.services.map((name, i) => {
              const Icon = serviceListIcons[i];
              return (
                <li key={i} onClick={() => router.push("/services")} style={{ cursor: "pointer" }}>
                  <span className="icon">
                    <Icon size={16} />
                  </span>
                  {name}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>{t.vacancies}</h2>
            <Link href="/jobs" className="link">
              {t.all}
            </Link>
          </div>
          {jobs.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Пока нет вакансий. <Link href="/new" className="link">Разместить первую</Link>
            </p>
          )}
          {jobs.map((j) => (
            <div
              key={j.id}
              className="vacancy-item"
              onClick={() => router.push(`/listing?id=${j.id}`)}
              style={{ cursor: "pointer" }}
            >
              <h4>{j.title}</h4>
              <div className="meta">
                <span className="salary">{formatPrice(j)}</span>
                {j.city && <span>{j.city}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>{t.listings}</h2>
            <Link href="/housing" className="link">
              {t.all}
            </Link>
          </div>
          {homes.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Пока нет объявлений. <Link href="/new" className="link">Разместить первое</Link>
            </p>
          )}
          {homes.map((h, i) => (
            <div
              key={h.id}
              className="listing-item"
              onClick={() => router.push(`/listing?id=${h.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div
                className="listing-thumb"
                style={
                  h.photoUrls[0]
                    ? { backgroundImage: `url(${h.photoUrls[0]})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: `linear-gradient(135deg, ${i === 0 ? "#a8c0e8, #7a9ad0" : "#c5b8e0, #9a88c8"})` }
                }
              />
              <div className="listing-info">
                <h4>{h.title}</h4>
                <div className="price">{formatPrice(h)}</div>
                <Heart size={14} className="heart" />
              </div>
            </div>
          ))}
        </div>

        <div className="panel promo-panel">
          <h3>{t.banner}</h3>
          <Link href="/about" className="btn">
            {t.details}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
            {t.language}
          </div>
          <div className="lang-switch">
            {(
              [
                ["uz-Latn", "O‘zbekcha (Lotin)"],
                ["uz-Cyrl", "Ўзбекча (Кирилл)"],
                ["ru", "🇷🇺 Русский"],
              ] as const
            ).map(([code, label]) => (
              <button
                key={code}
                className={`lang-btn ${locale === code ? "active" : ""}`}
                onClick={() => setLocale(code)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="theme-switch">
          {dark ? <Moon size={16} /> : <Sun size={16} />}
          <span>{t.theme}</span>
          <div
            className="switch"
            onClick={() => setDark((d) => !d)}
            role="switch"
            aria-checked={dark}
          />
        </div>
      </footer>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        t={t}
        locale={locale}
      />
    </main>
  );
}
