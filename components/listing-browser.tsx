"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import ListingCard from "./listing-card";
import AdBanner from "./ad-banner";
import {
  CATEGORIES,
  DEAL_LABEL,
  fetchListings,
  type Deal,
  type Listing,
  type ListingType,
} from "@/lib/listings";
import { fetchPublicProfiles, type PublicProfile } from "@/lib/social";
import type { AdSlotId } from "@/lib/site";
import { friendlyError, getQueryParam } from "@/lib/util";

const PAGE = 24;

type Applied = {
  q: string;
  city: string;
  category: string;
  deal: Deal | "";
  priceMin: string;
  priceMax: string;
  sort: "new" | "price_asc" | "price_desc";
  type: ListingType | "";
};

const toNum = (s: string) => {
  if (s.trim() === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export default function ListingBrowser({
  fixedType,
  adSlot,
  onQueryApplied,
}: {
  fixedType?: ListingType;
  adSlot: AdSlotId;
  onQueryApplied?: (q: string) => void;
}) {
  const [form, setForm] = useState<Applied>({
    q: "", city: "", category: "", deal: "", priceMin: "", priceMax: "", sort: "new", type: fixedType ?? "",
  });
  const [applied, setApplied] = useState<Applied | null>(null);
  const [items, setItems] = useState<Listing[]>([]);
  const [owners, setOwners] = useState<Record<string, PublicProfile>>({});
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const req = useRef(0);

  // First load: take the search text from the address (?q=...)
  useEffect(() => {
    const first = { ...form, q: getQueryParam("q") };
    setForm(first);
    setApplied(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async (a: Applied, offset: number) => {
    const id = ++req.current;
    setLoading(true);
    setError("");
    try {
      const batch = await fetchListings({
        type: (fixedType ?? (a.type || undefined)) as ListingType | undefined,
        q: a.q,
        city: a.city,
        category: a.category || undefined,
        deal: a.deal || undefined,
        priceMin: toNum(a.priceMin),
        priceMax: toNum(a.priceMax),
        sort: a.sort,
        limit: PAGE,
        offset,
      });
      const profiles = await fetchPublicProfiles(batch.map((b) => b.ownerId)).catch(() => ({}));
      if (id !== req.current) return; // a newer request replaced this one
      setItems((prev) => (offset === 0 ? batch : [...prev, ...batch]));
      setOwners((prev) => ({ ...prev, ...profiles }));
      setMore(batch.length === PAGE);
    } catch (err) {
      if (id === req.current) setError(friendlyError(err));
    } finally {
      if (id === req.current) setLoading(false);
    }
  }, [fixedType]);

  useEffect(() => {
    if (!applied) return;
    onQueryApplied?.(applied.q);
    void load(applied, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, load]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    setApplied({ ...form });
  };

  const change = (patch: Partial<Applied>) => {
    const next = { ...form, ...patch };
    setForm(next);
    // selects apply immediately; text fields wait for the Search button
    if ("category" in patch || "deal" in patch || "sort" in patch || "type" in patch) setApplied(next);
  };

  const activeType = (fixedType ?? (form.type || undefined)) as ListingType | undefined;
  const categories = activeType ? CATEGORIES[activeType] : [];

  return (
    <div>
      <AdBanner slot={adSlot} />

      {!fixedType && (
        <div className="filters" style={{ marginTop: 16 }}>
          {([["", "Все"], ["job", "Работа"], ["service", "Услуги"], ["housing", "Жильё"]] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              className={`filter-chip ${form.type === v ? "active" : ""}`}
              onClick={() => change({ type: v as Applied["type"], category: "", deal: "" })}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="vp-filter-form">
        <div className="vp-search-row">
          <input
            className="input"
            placeholder="Что ищете?"
            value={form.q}
            onChange={(e) => change({ q: e.target.value })}
            aria-label="Поиск"
          />
          <button type="submit" className="vp-btn vp-btn-primary" aria-label="Найти">
            <Search size={16} /> <span className="vp-hide-xs">Найти</span>
          </button>
        </div>
        <div className="vp-filter-grid">
          <input className="input" placeholder="Город" value={form.city} onChange={(e) => change({ city: e.target.value })} />
          {categories.length > 0 && (
            <select className="input" value={form.category} onChange={(e) => change({ category: e.target.value })}>
              <option value="">Все категории</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          {activeType === "housing" && (
            <select className="input" value={form.deal} onChange={(e) => change({ deal: e.target.value as Deal | "" })}>
              <option value="">Аренда и продажа</option>
              <option value="rent">{DEAL_LABEL.rent}</option>
              <option value="sale">{DEAL_LABEL.sale}</option>
            </select>
          )}
          <input className="input" type="number" min={0} inputMode="numeric" placeholder="Цена от" value={form.priceMin} onChange={(e) => change({ priceMin: e.target.value })} />
          <input className="input" type="number" min={0} inputMode="numeric" placeholder="Цена до" value={form.priceMax} onChange={(e) => change({ priceMax: e.target.value })} />
          <select className="input" value={form.sort} onChange={(e) => change({ sort: e.target.value as Applied["sort"] })}>
            <option value="new">Сначала новые</option>
            <option value="price_asc">Сначала дешевле</option>
            <option value="price_desc">Сначала дороже</option>
          </select>
        </div>
      </form>

      {error && <div className="vp-error">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          Ничего не найдено. Измените условия поиска или разместите своё объявление.
        </div>
      )}

      <div className="vp-grid">
        {items.map((l) => (
          <ListingCard key={l.id} l={l} owner={owners[l.ownerId]} />
        ))}
      </div>

      {loading && <p style={{ color: "var(--muted)", textAlign: "center", padding: 16 }}>Загрузка…</p>}

      {!loading && more && applied && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button type="button" className="vp-btn" onClick={() => load(applied, items.length)}>
            Показать ещё
          </button>
        </div>
      )}
    </div>
  );
}

