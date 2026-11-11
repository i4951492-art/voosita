"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Flag, Heart, MessageCircle, Pencil, Share2, Star, Trash2 } from "lucide-react";
import PageShell, { type ShellCtx } from "@/components/page-shell";
import ReportDialog from "@/components/report-dialog";
import {
  DEAL_LABEL,
  TYPE_META,
  deleteListing,
  fetchFavoriteIds,
  fetchListing,
  formatPrice,
  setFavorite,
  setListingStatus,
  type Listing,
} from "@/lib/listings";
import { getOrCreateDirect } from "@/lib/chat";
import { fetchPublicProfile, type PublicProfile } from "@/lib/social";
import { removeImage } from "@/lib/storage";
import { isAdmin } from "@/lib/store";
import { formatDate, friendlyError, getQueryParam, UUID_RE } from "@/lib/util";

function ListingBody({ ctx }: { ctx: ShellCtx }) {
  const { user, openAuth } = ctx;
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null | undefined>(undefined);
  const [owner, setOwner] = useState<PublicProfile | null>(null);
  const [photo, setPhoto] = useState(0);
  const [fav, setFav] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = getQueryParam("id");
    if (!UUID_RE.test(id)) {
      setListing(null);
      return;
    }
    let alive = true;
    fetchListing(id)
      .then(async (l) => {
        if (!alive) return;
        setListing(l);
        if (l) {
          const p = await fetchPublicProfile(l.ownerId).catch(() => null);
          if (alive) setOwner(p);
        }
      })
      .catch((err) => {
        if (!alive) return;
        setListing(null);
        setError(friendlyError(err));
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!user || !listing) {
      setFav(false);
      return;
    }
    fetchFavoriteIds()
      .then((ids) => setFav(ids.includes(listing.id)))
      .catch(() => undefined);
  }, [user, listing]);

  if (listing === undefined) return <p style={{ color: "var(--muted)" }}>Загрузка…</p>;
  if (listing === null) {
    return (
      <div className="empty-state">
        {error || "Объявление не найдено или скрыто."}
        <div style={{ marginTop: 12 }}><Link href="/" className="vp-link">На главную</Link></div>
      </div>
    );
  }

  const isOwner = Boolean(user && user.id === listing.ownerId);
  const admin = isAdmin(user);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await fn();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const write = () => {
    if (!user) return openAuth();
    void run(async () => {
      const cid = await getOrCreateDirect(listing.ownerId, listing.id);
      router.push(`/messages?c=${cid}`);
    });
  };

  const toggleFav = () => {
    if (!user) return openAuth();
    void run(async () => {
      await setFavorite(listing.id, !fav);
      setFav(!fav);
    });
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: listing.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setInfo("Ссылка скопирована");
      }
    } catch {
      /* the person closed the share window */
    }
  };

  const changeStatus = (status: "active" | "hidden" | "removed") =>
    run(async () => {
      await setListingStatus(listing.id, status);
      setListing({ ...listing, status });
    });

  const remove = () => {
    if (!window.confirm("Удалить объявление? Это нельзя отменить.")) return;
    void run(async () => {
      await deleteListing(listing.id);
      listing.photoUrls.forEach((u) => removeImage("listing-photos", u).catch(() => undefined));
      router.push(isOwner ? "/my-listings" : "/");
    });
  };

  const facts = [
    TYPE_META[listing.type].label,
    listing.category,
    listing.type === "housing" && listing.deal ? DEAL_LABEL[listing.deal] : null,
    listing.type === "housing" && listing.rooms ? `${listing.rooms} комн.` : null,
    listing.city,
    formatDate(listing.createdAt),
  ].filter(Boolean) as string[];

  return (
    <>
      {listing.status !== "active" && (
        <div className="vp-notice">
          {listing.status === "hidden" ? "Объявление скрыто: его видите только вы." : "Объявление снято модератором."}
        </div>
      )}

      <div className="vp-detail">
        <div>
          {listing.photoUrls.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.photoUrls[photo] ?? listing.photoUrls[0]} alt="" className="vp-gallery-main" />
              {listing.photoUrls.length > 1 && (
                <div className="vp-thumbs">
                  {listing.photoUrls.map((u, i) => (
                    <button key={u} type="button" onClick={() => setPhoto(i)} className={i === photo ? "on" : ""} aria-label={`Фото ${i + 1}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="vp-gallery-main vp-card-noimg">{TYPE_META[listing.type].label}</div>
          )}

          <h1 className="page-title" style={{ marginTop: 16 }}>{listing.title}</h1>
          <div className="vp-chips">{facts.map((f) => <span key={f}>{f}</span>)}</div>
          {listing.description ? (
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 16 }}>{listing.description}</p>
          ) : (
            <p style={{ color: "var(--muted)", marginTop: 16 }}>Описание не указано.</p>
          )}
        </div>

        <aside className="vp-aside">
          <div className="vp-section">
            <div className="vp-price">{formatPrice(listing)}</div>

            {owner && (
              <Link href={`/user?id=${owner.id}`} className="vp-owner">
                <div className="vp-avatar">
                  {owner.photoUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={owner.photoUrls[0]} alt="" />
                  ) : (
                    <span style={{ fontWeight: 800 }}>{owner.name.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <strong>{owner.name}</strong>
                  {owner.reviewsCount > 0 && (
                    <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 3 }}>
                      <Star size={13} fill="#f5a623" color="#f5a623" /> {owner.ratingAvg.toFixed(1)}
                      <span style={{ color: "var(--muted)" }}>({owner.reviewsCount})</span>
                    </div>
                  )}
                </div>
              </Link>
            )}

            {!isOwner && (
              <button type="button" className="vp-btn vp-btn-primary vp-btn-block" disabled={busy} onClick={write}>
                <MessageCircle size={16} /> Написать
              </button>
            )}

            <div className="vp-actions" style={{ marginTop: 10 }}>
              <button type="button" className="vp-btn" disabled={busy} onClick={toggleFav} aria-pressed={fav}>
                <Heart size={15} fill={fav ? "#e0245e" : "none"} color={fav ? "#e0245e" : "currentColor"} />
                {fav ? "В избранном" : "В избранное"}
              </button>
              <button type="button" className="vp-btn" onClick={share}>
                <Share2 size={15} /> Поделиться
              </button>
              {!isOwner && (
                <button type="button" className="vp-btn" onClick={() => (user ? setReportOpen(true) : openAuth())}>
                  <Flag size={15} /> Пожаловаться
                </button>
              )}
            </div>

            {isOwner && (
              <div className="vp-actions" style={{ marginTop: 10 }}>
                <Link href={`/new?edit=${listing.id}`} className="vp-btn"><Pencil size={15} /> Изменить</Link>
                {listing.status !== "removed" && (
                  <button type="button" className="vp-btn" disabled={busy} onClick={() => changeStatus(listing.status === "active" ? "hidden" : "active")}>
                    {listing.status === "active" ? "Скрыть" : "Опубликовать"}
                  </button>
                )}
                <button type="button" className="vp-btn vp-btn-danger" disabled={busy} onClick={remove}><Trash2 size={15} /></button>
              </div>
            )}

            {admin && !isOwner && (
              <div className="vp-actions" style={{ marginTop: 10 }}>
                <button type="button" className="vp-btn vp-btn-danger" disabled={busy} onClick={() => changeStatus(listing.status === "removed" ? "active" : "removed")}>
                  <Ban size={15} /> {listing.status === "removed" ? "Вернуть" : "Снять (модерация)"}
                </button>
                <button type="button" className="vp-btn vp-btn-danger" disabled={busy} onClick={remove}><Trash2 size={15} /> Удалить</button>
              </div>
            )}

            {info && <div style={{ color: "var(--blue)", fontSize: 13, marginTop: 10 }}>{info}</div>}
            {error && <div className="vp-error">{error}</div>}
          </div>
        </aside>
      </div>

      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Пожаловаться на объявление"
        listingId={listing.id}
      />
    </>
  );
}

export default function ListingPage() {
  return <PageShell maxWidth={1000}>{(ctx) => <ListingBody ctx={ctx} />}</PageShell>;
}
