"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  X,
  Wrench,
  Code2,
  GraduationCap,
  Car,
  Heart,
  Moon,
  Sun,
} from "lucide-react";
import { copy, type Locale } from "@/lib/i18n";
import AuthModal from "./auth-modal";

const SLIDES = ["samarkand", "bukhara", "mountains", "tashkent"] as const;
const SALARIES = ["15 000 000 so‘m", "12 000 000 so‘m", "10 000 000 so‘m"];
const PRICES = ["4 500 000", "6 200 000"];

const CARD_LINKS = ["/jobs", "/services", "/housing", "/housing"];

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("uz-Latn");
  const [dark, setDark] = useState(false);
  const [slide, setSlide] = useState(0);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const t = copy[locale];

  useEffect(() => {
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

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

  const nextSlide = useCallback(() => {
    setSlide((s) => (s + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const handleStub = (label: string) => {
    alert(`${label} — ${t.comingSoon}`);
  };

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
              <button className="pill-btn" onClick={() => setAuthOpen(true)}>
                <UserRound size={16} />
                {t.profile}
                <ChevronDown size={14} />
              </button>
            </div>

            <div className="logo">
              <div className="logo-v">V</div>
              <span className="logo-text">VOOSITA</span>
            </div>

            <div className="topbar-right">
              <button className="pill-btn" onClick={() => setAboutOpen(true)}>
                <Settings size={16} />
                {t.settings}
                <ChevronDown size={14} />
              </button>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleStub("Поиск");
                }}
              />
              <button
                className="search-btn"
                onClick={() => handleStub("Поиск")}
                aria-label="Search"
              >
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

            <button className="about-btn" onClick={() => setAboutOpen(true)}>
              {t.about}
            </button>
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
                <li key={i} onClick={() => (window.location.href = "/services")}>
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
          {t.vacancyNames.map((name, i) => (
            <div
              key={i}
              className="vacancy-item"
              onClick={() => (window.location.href = "/jobs")}
              style={{ cursor: "pointer" }}
            >
              <h4>{name}</h4>
              <div className="meta">
                <span className="salary">{SALARIES[i]}</span>
                <span>Toshkent</span>
                <span>
                  {i + 1} {t.daysAgo}
                </span>
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
          {t.homes.map((name, i) => (
            <div
              key={i}
              className="listing-item"
              onClick={() => (window.location.href = "/housing")}
              style={{ cursor: "pointer" }}
            >
              <div
                className="listing-thumb"
                style={{
                  background: `linear-gradient(135deg, ${
                    i === 0 ? "#a8c0e8, #7a9ad0" : "#c5b8e0, #9a88c8"
                  })`,
                }}
              />
              <div className="listing-info">
                <h4>{name}</h4>
                <div className="price">
                  {PRICES[i]} so‘m {t.perMonth}
                </div>
                <Heart size={14} className="heart" />
              </div>
            </div>
          ))}
        </div>

        <div className="panel promo-panel">
          <h3>{t.banner}</h3>
          <button className="btn" onClick={() => setAboutOpen(true)}>
            {t.details}
          </button>
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

      {/* About modal */}
      <div
        className={`overlay ${aboutOpen ? "open" : ""}`}
        onClick={() => setAboutOpen(false)}
      />
      <div className={`about-pop ${aboutOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setAboutOpen(false)}>
          <X size={16} />
        </button>
        <h3>VOOSITA</h3>
        <p>{t.aboutText}</p>
        <p style={{ fontSize: 13, opacity: 0.8 }}>{t.banner}</p>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        t={t}
        locale={locale}
      />
    </main>
  );
}
