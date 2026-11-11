"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { adminFetchListings, type AdminListing } from "@/lib/site";
import { TYPE_META, deleteListing, setListingStatus, type ListingStatus } from "@/lib/listings";
import { formatDate, friendlyError } from "@/lib/util";

const STATUS_LABEL: Record<ListingStatus, string> = {
  active: "опубликовано",
  hidden: "скрыто владельцем",
  removed: "снято модератором",
};

export default function ListingsTab() {
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [items, setItems] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await adminFetchListings(applied));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy("");
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setApplied(q);
  };

  return (
    <>
      <form onSubmit={submit} className="vp-search-row" style={{ marginBottom: 16 }}>
        <input className="input" placeholder="Заголовок объявления" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="vp-btn vp-btn-primary">Найти</button>
      </form>
      {error && <div className="vp-error">{error}</div>}
      {loading && <p style={{ color: "var(--muted)" }}>Загрузка…</p>}
      {!loading && items.length === 0 && <div className="empty-state">Объявлений нет.</div>}
      {items.map((l) => (
        <div key={l.id} className="vp-section vp-row">
          <div style={{ minWidth: 0, flex: 1 }}>
            <Link href={`/listing?id=${l.id}`} style={{ fontWeight: 700 }}>{l.title}</Link>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {TYPE_META[l.type].label} · {STATUS_LABEL[l.status]} · {formatDate(l.createdAt)}
            </div>
          </div>
          <div className="vp-actions">
            <button
              type="button"
              className="vp-btn"
              disabled={busy === l.id}
              onClick={() => act(l.id, () => setListingStatus(l.id, l.status === "removed" ? "active" : "removed"))}
            >
              {l.status === "removed" ? "Вернуть" : "Снять"}
            </button>
            <button
              type="button"
              className="vp-btn vp-btn-danger"
              disabled={busy === l.id}
              onClick={() => {
                if (window.confirm(`Удалить «${l.title}» навсегда?`)) void act(l.id, () => deleteListing(l.id));
              }}
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
