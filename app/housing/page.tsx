"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Heart } from "lucide-react";
import SiteHeader from "@/components/site-header";
import AuthModal from "@/components/auth-modal";
import { copy, type Locale } from "@/lib/i18n";

const homes = [
  {
    title: "2 xonali kvartira, Chilonzor",
    rooms: 2,
    area: 54,
    floor: "5/9",
    price: "4 500 000",
    city: "Toshkent",
    features: ["Mebel", "Konditsioner", "Internet"],
    repair: "Evroremont",
  },
  {
    title: "3 xonali kvartira, Yakkasaroy",
    rooms: 3,
    area: 78,
    floor: "3/5",
    price: "6 200 000",
    city: "Toshkent",
    features: ["Mebel", "Texnika", "Balkon"],
    repair: "Yaxshi",
  },
  {
    title: "1 xonali kvartira, Yunusobod",
    rooms: 1,
    area: 38,
    floor: "8/12",
    price: "3 200 000",
    city: "Toshkent",
    features: ["Yangi ta’mir", "Internet"],
    repair: "Evroremont",
  },
  {
    title: "Kottej, Qibray",
    rooms: 4,
    area: 160,
    floor: "1/2",
    price: "12 000 000",
    city: "Toshkent vil.",
    features: ["Hovli", "Garaj", "Mebel"],
    repair: "Yaxshi",
  },
  {
    title: "2 xonali, Samarqand markaz",
    rooms: 2,
    area: 48,
    floor: "2/4",
    price: "3 800 000",
    city: "Samarqand",
    features: ["Mebel", "Konditsioner"],
    repair: "Oddiy",
  },
  {
    title: "Studio, Mirzo Ulug‘bek",
    rooms: 1,
    area: 32,
    floor: "14/16",
    price: "2 900 000",
    city: "Toshkent",
    features: ["Yangi", "Internet", "Lift"],
    repair: "Evroremont",
  },
];

export default function HousingPage() {
  const [locale, setLocale] = useState<Locale>("uz-Latn");
  const [dark, setDark] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [rooms, setRooms] = useState<string>("all");
  const [repair, setRepair] = useState<string>("all");

  const t = copy[locale];

  useEffect(() => {
    const savedLocale = localStorage.getItem("voosita-locale") as Locale | null;
    const savedDark = localStorage.getItem("voosita-dark") === "1";
    if (savedLocale && copy[savedLocale]) setLocale(savedLocale);
    if (savedDark) setDark(true);
  }, []);
  useEffect(() => localStorage.setItem("voosita-locale", locale), [locale]);
  useEffect(() => localStorage.setItem("voosita-dark", dark ? "1" : "0"), [dark]);

  let filtered = homes;
  if (rooms !== "all") {
    const r = parseInt(rooms, 10);
    filtered = filtered.filter((h) => (rooms === "3+" ? h.rooms >= 3 : h.rooms === r));
  }
  if (repair !== "all") {
    filtered = filtered.filter((h) => h.repair === repair);
  }

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
        <Link href="/" style={{ fontSize: 13, color: "var(--blue-bright)", fontWeight: 600 }}>
          ← {t.backHome}
        </Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>
          {t.housingTitle}
        </h1>
        <p className="page-subtitle">{t.housingSubtitle}</p>

        {/* Cian-inspired filters */}
        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
          Xonalar
        </div>
        <div className="filters" style={{ marginBottom: 16 }}>
          {["all", "1", "2", "3", "3+"].map((f) => (
            <button
              key={f}
              className={`filter-chip ${rooms === f ? "active" : ""}`}
              onClick={() => setRooms(f)}
            >
              {f === "all" ? t.all : f === "3+" ? "3+" : f + " " + t.rooms}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
          Ta’mir
        </div>
        <div className="filters">
          {["all", "Evroremont", "Yaxshi", "Oddiy"].map((f) => (
            <button
              key={f}
              className={`filter-chip ${repair === f ? "active" : ""}`}
              onClick={() => setRepair(f)}
            >
              {f === "all" ? t.all : f}
            </button>
          ))}
        </div>

        <div className="cards-grid" style={{ marginTop: 8 }}>
          {filtered.map((h, i) => (
            <div key={i} className="item-card">
              <div
                style={{
                  height: 140,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${
                    i % 2 === 0 ? "#a8c0e8, #7a9ad0" : "#c5b8e0, #9a88c8"
                  })`,
                  marginBottom: 12,
                  position: "relative",
                }}
              >
                <button
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => alert("Sevimlilarga qo‘shildi")}
                >
                  <Heart size={16} color="#667895" />
                </button>
              </div>
              <h3>{h.title}</h3>
              <div className="meta" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span>{h.rooms} xona</span>
                <span>{h.area} m²</span>
                <span>{h.floor} qavat</span>
              </div>
              <div className="meta" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={12} /> {h.city} · {h.repair}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {h.features.map((f) => (
                  <span
                    key={f}
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "var(--bg-soft)",
                      fontWeight: 600,
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
              <div className="price" style={{ marginTop: 10 }}>
                {h.price} so‘m {t.perMonth}
              </div>
              <div className="actions">
                <button
                  className="btn-primary"
                  onClick={() => alert(t.contact + " — " + t.comingSoon)}
                >
                  {t.contact}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">Hech narsa topilmadi. Filtrlarni o‘zgartiring.</div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} t={t} locale={locale} />
    </main>
  );
}
