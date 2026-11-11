"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import PageShell from "@/components/page-shell";
import {
  TYPE_META,
  deleteListing,
  fetchMyListings,
  formatPrice,
  setListingStatus,
  type Listing,
} from "@/lib/listings";
import { removeImage } from "@/lib/storage";
import { formatDate, friendlyError } from "@/lib/util";
import type { User } from "@/lib/store";

function MyList({ user }: { user: User }) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let alive = true;
    fetchMyListings()
      .then((l) => alive && setItems(l))
      .catch((err) => alive && setError(friendlyError(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user.id]);

  const toggle = async (l: Listing) => {
    setBusyId(l.id);
    setError("");
    try {
      const next = l.status === "active" ? "hidden" : "active";
      await setListingStatus(l.id, next);
      setItems((prev) => prev.map((x) => (x.id === l.id ? { ...x, status: next } : x)));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusyId("");
    }
  };

  const remove = async (l: Listing) => {
    if (!window.confirm(`Удалить объявление «${l.title}»? Это нельзя отменить.`)) return;
    setBusyId(l.id);
    setError("");
    try {
      await deleteListing(l.id);
      l.photoUrls.forEach((u) => removeImage("listing-photos", u).catch(() => undefined));
      setItems((prev) => prev.filter((x) => x.id !== l.id));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <p style={{ color: "var(--muted)" }}>Загрузка…</p>;

  return (
    <>
      {error && <div className="vp-error">{error}</div>}
      {items.length === 0 && <div className="empty-state">У вас пока нет объявлений.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((l) => (
          <div key={l.id} className="vp-section vp-row">
            <div style={{ minWidth: 0, flex: 1 }}>
              <Link href={`/listing?id=${l.id}`} style={{ fontWeight: 700 }}>{l.title}</Link>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                {TYPE_META[l.type].label} · {formatPrice(l)} · {formatDate(l.createdAt)}
              </div>
              <div style={{ fontSize: 12, marginTop: 4, color: l.status === "active" ? "var(--blue)" : "var(--muted)" }}>
                {l.status === "active" ? "Опубликовано" : l.status === "hidden" ? "Скрыто" : "Удалено модератором"}
              </div>
            </div>
            <div className="vp-actions">
              <Link href={`/new?edit=${l.id}`} className="vp-btn" aria-label="Редактировать">
                <Pencil size={14} /> <span className="vp-hide-xs">Изменить</span>
              </Link>
              {l.status !== "removed" && (
                <button type="button" className="vp-btn" disabled={busyId === l.id} onClick={() => toggle(l)}>
                  {l.status === "active" ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span className="vp-hide-xs">{l.status === "active" ? "Скрыть" : "Показать"}</span>
                </button>
              )}
              <button type="button" className="vp-btn vp-btn-danger" disabled={busyId === l.id} onClick={() => remove(l)} aria-label="Удалить">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function MyListingsPage() {
  return (
    <PageShell maxWidth={860}>
      {({ ready, user, openAuth }) => (
        <>
          <div className="vp-row" style={{ marginBottom: 16 }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Мои объявления</h1>
            <Link href="/new" className="vp-btn vp-btn-primary"><Plus size={16} /> Разместить</Link>
          </div>
          {!ready ? (
            <p style={{ color: "var(--muted)" }}>Загрузка…</p>
          ) : !user ? (
            <div className="vp-section">
              <p style={{ marginBottom: 12 }}>Войдите, чтобы увидеть свои объявления.</p>
              <button type="button" className="vp-btn vp-btn-primary" onClick={openAuth}>Войти</button>
            </div>
          ) : (
            <MyList user={user} />
          )}
        </>
      )}
    </PageShell>
  );
}
