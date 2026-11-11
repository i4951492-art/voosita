"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/page-shell";
import ListingCard from "@/components/listing-card";
import { fetchFavoriteListings, type Listing } from "@/lib/listings";
import { fetchPublicProfiles, type PublicProfile } from "@/lib/social";
import { friendlyError } from "@/lib/util";
import type { User } from "@/lib/store";

function FavoritesList({ user }: { user: User }) {
  const [items, setItems] = useState<Listing[]>([]);
  const [owners, setOwners] = useState<Record<string, PublicProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetchFavoriteListings()
      .then(async (list) => {
        const profiles = await fetchPublicProfiles(list.map((l) => l.ownerId)).catch(() => ({}));
        if (!alive) return;
        setItems(list);
        setOwners(profiles);
      })
      .catch((err) => alive && setError(friendlyError(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user.id]);

  if (loading) return <p style={{ color: "var(--muted)" }}>Загрузка…</p>;
  if (error) return <div className="vp-error">{error}</div>;
  if (items.length === 0) return <div className="empty-state">В избранном пока ничего нет.</div>;
  return (
    <div className="vp-grid">
      {items.map((l) => (
        <ListingCard key={l.id} l={l} owner={owners[l.ownerId]} />
      ))}
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <PageShell>
      {({ ready, user, openAuth }) => (
        <>
          <h1 className="page-title">Избранное</h1>
          <p className="page-subtitle">Объявления, которые вы сохранили.</p>
          {!ready ? (
            <p style={{ color: "var(--muted)" }}>Загрузка…</p>
          ) : !user ? (
            <div className="vp-section">
              <p style={{ marginBottom: 12 }}>Войдите, чтобы увидеть избранное.</p>
              <button type="button" className="vp-btn vp-btn-primary" onClick={openAuth}>Войти</button>
            </div>
          ) : (
            <FavoritesList user={user} />
          )}
        </>
      )}
    </PageShell>
  );
}
