"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Flag, MessageCircle, Trash2, UserX } from "lucide-react";
import PageShell, { type ShellCtx } from "@/components/page-shell";
import ReportDialog from "@/components/report-dialog";
import ListingCard from "@/components/listing-card";
import Stars from "@/components/stars";
import { GOALS } from "@/lib/profile";
import { fetchListings, type Listing } from "@/lib/listings";
import { getOrCreateDirect } from "@/lib/chat";
import {
  deleteReview,
  fetchPublicProfile,
  fetchPublicProfiles,
  fetchReviews,
  hasChatWith,
  isBlockedByMe,
  saveReview,
  setBlocked,
  type PublicProfile,
  type Review,
} from "@/lib/social";
import { adminSetBan } from "@/lib/site";
import { isAdmin } from "@/lib/store";
import { formatDate, friendlyError, getQueryParam, UUID_RE } from "@/lib/util";

function UserBody({ ctx }: { ctx: ShellCtx }) {
  const { user, openAuth } = ctx;
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [authors, setAuthors] = useState<Record<string, PublicProfile>>({});
  const [listings, setListings] = useState<Listing[]>([]);
  const [blocked, setBlockedState] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const loadReviews = useCallback(async (id: string) => {
    const list = await fetchReviews(id);
    setReviews(list);
    setAuthors(await fetchPublicProfiles(list.map((r) => r.authorId)).catch(() => ({})));
  }, []);

  useEffect(() => {
    const id = getQueryParam("id");
    if (!UUID_RE.test(id)) {
      setProfile(null);
      return;
    }
    setUid(id);
    let alive = true;
    fetchPublicProfile(id)
      .then((p) => alive && setProfile(p))
      .catch(() => alive && setProfile(null));
    loadReviews(id).catch(() => undefined);
    fetchListings({ ownerId: id, limit: 12 })
      .then((l) => alive && setListings(l))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [loadReviews]);

  useEffect(() => {
    if (!user || !uid || user.id === uid) return;
    isBlockedByMe(uid).then(setBlockedState).catch(() => undefined);
    hasChatWith(uid).then(setCanReview).catch(() => undefined);
  }, [user, uid]);

  // Fill the form with the visitor's own review, if there is one
  useEffect(() => {
    if (!user) return;
    const mine = reviews.find((r) => r.authorId === user.id);
    if (mine) {
      setRating(mine.rating);
      setBody(mine.body ?? "");
    }
  }, [reviews, user]);

  if (profile === undefined) return <p style={{ color: "var(--muted)" }}>Загрузка…</p>;
  if (profile === null) {
    return (
      <div className="empty-state">
        Пользователь не найден.
        <div style={{ marginTop: 12 }}><Link href="/" className="vp-link">На главную</Link></div>
      </div>
    );
  }

  const isMe = Boolean(user && user.id === profile.id);
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
      const cid = await getOrCreateDirect(profile.id);
      router.push(`/messages?c=${cid}`);
    });
  };

  const toggleBlock = () =>
    run(async () => {
      if (!blocked && !window.confirm("Заблокировать пользователя? Он не сможет вам писать.")) return;
      await setBlocked(profile.id, !blocked);
      setBlockedState(!blocked);
      setInfo(!blocked ? "Пользователь заблокирован" : "Пользователь разблокирован");
    });

  const ban = () =>
    run(async () => {
      if (!window.confirm("Заблокировать аккаунт на сайте и скрыть все его объявления?")) return;
      await adminSetBan(profile.id, true);
      router.push("/admin?tab=users");
    });

  const sendReview = () =>
    run(async () => {
      await saveReview(profile.id, rating, body);
      await loadReviews(profile.id);
      setProfile(await fetchPublicProfile(profile.id));
      setInfo("Отзыв сохранён");
    });

  const removeReview = (id: string) =>
    run(async () => {
      await deleteReview(id);
      await loadReviews(profile.id);
      setProfile(await fetchPublicProfile(profile.id));
    });

  const goalLabels = profile.goals.map((g) => GOALS.find((x) => x.id === g)?.label).filter(Boolean) as string[];

  return (
    <>
      <div className="vp-section vp-profile-head">
        <div className="vp-avatar vp-avatar-lg">
          {profile.photoUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoUrls[0]} alt="" />
          ) : (
            <span style={{ fontWeight: 800, fontSize: 28 }}>{profile.name.slice(0, 1).toUpperCase()}</span>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: 4 }}>{profile.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Stars value={profile.ratingAvg} />
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              {profile.reviewsCount > 0 ? `${profile.ratingAvg.toFixed(1)} · отзывов: ${profile.reviewsCount}` : "Пока нет отзывов"}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            {[profile.city, `на сайте с ${formatDate(profile.createdAt)}`].filter(Boolean).join(" · ")}
          </div>
          {goalLabels.length > 0 && (
            <div className="vp-chips" style={{ marginTop: 10 }}>{goalLabels.map((g) => <span key={g}>{g}</span>)}</div>
          )}
        </div>
      </div>

      {isMe ? (
        <div className="vp-actions" style={{ marginBottom: 16 }}>
          <Link href="/my-profile" className="vp-btn vp-btn-primary">Редактировать мой профиль</Link>
        </div>
      ) : (
        <div className="vp-actions" style={{ marginBottom: 16 }}>
          <button type="button" className="vp-btn vp-btn-primary" disabled={busy} onClick={write}>
            <MessageCircle size={16} /> Написать
          </button>
          <button type="button" className="vp-btn" onClick={() => (user ? setReportOpen(true) : openAuth())}>
            <Flag size={15} /> Пожаловаться
          </button>
          {user && (
            <button type="button" className="vp-btn" disabled={busy} onClick={toggleBlock}>
              <UserX size={15} /> {blocked ? "Разблокировать" : "Заблокировать"}
            </button>
          )}
          {admin && (
            <button type="button" className="vp-btn vp-btn-danger" disabled={busy} onClick={ban}>
              <Ban size={15} /> Забанить
            </button>
          )}
        </div>
      )}
      {info && <div style={{ color: "var(--blue)", fontSize: 13, marginBottom: 10 }}>{info}</div>}
      {error && <div className="vp-error" style={{ marginBottom: 10 }}>{error}</div>}

      {!profile.isPublic && (
        <div className="vp-notice">Пользователь скрыл анкету. Вы можете написать ему в чате.</div>
      )}

      {profile.bio && (
        <div className="vp-section">
          <h2>О себе</h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{profile.bio}</p>
        </div>
      )}

      {(profile.skills.length > 0 || profile.experienceYears !== null || profile.priceFrom !== null) && (
        <div className="vp-section">
          <h2>Навыки и опыт</h2>
          {profile.skills.length > 0 && (
            <div className="vp-chips" style={{ marginBottom: 10 }}>{profile.skills.map((s) => <span key={s}>{s}</span>)}</div>
          )}
          {profile.experienceYears !== null && <p>Опыт: {profile.experienceYears} лет</p>}
          {profile.priceFrom !== null && (
            <p>
              Оплата: от {profile.priceFrom.toLocaleString("ru-RU")}
              {profile.priceTo !== null ? ` до ${profile.priceTo.toLocaleString("ru-RU")}` : ""} сум
            </p>
          )}
        </div>
      )}

      {profile.photoUrls.length > 1 && (
        <div className="vp-section">
          <h2>Фото</h2>
          <div className="vp-photo-grid">
            {profile.photoUrls.map((u) => (
              <div key={u} className="vp-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {listings.length > 0 && (
        <div className="vp-section">
          <h2>Объявления</h2>
          <div className="vp-grid">
            {listings.map((l) => <ListingCard key={l.id} l={l} owner={profile} />)}
          </div>
        </div>
      )}

      <div className="vp-section">
        <h2>Отзывы</h2>
        {reviews.length === 0 && <p style={{ color: "var(--muted)" }}>Отзывов пока нет.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="vp-review">
            <div className="vp-row">
              <div>
                <Link href={`/user?id=${r.authorId}`} style={{ fontWeight: 700 }}>
                  {authors[r.authorId]?.name ?? "Пользователь"}
                </Link>
                <div><Stars value={r.rating} size={14} /></div>
              </div>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{formatDate(r.createdAt)}</span>
            </div>
            {r.body && <p style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{r.body}</p>}
            {user && (user.id === r.authorId || admin) && (
              <button type="button" className="vp-btn vp-btn-danger" style={{ marginTop: 8 }} disabled={busy} onClick={() => removeReview(r.id)}>
                <Trash2 size={13} /> Удалить
              </button>
            )}
          </div>
        ))}

        {!isMe && (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Ваш отзыв</h3>
            {!user ? (
              <button type="button" className="vp-btn" onClick={openAuth}>Войдите, чтобы оставить отзыв</button>
            ) : !canReview ? (
              <p style={{ fontSize: 13, color: "var(--muted)" }}>
                Оставить отзыв можно после переписки с пользователем. Сначала напишите ему.
              </p>
            ) : (
              <>
                <Stars value={rating} onChange={setRating} size={26} />
                <textarea
                  className="input"
                  style={{ marginTop: 8, minHeight: 90 }}
                  maxLength={1000}
                  placeholder="Расскажите, как всё прошло"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <button type="button" className="vp-btn vp-btn-primary" style={{ marginTop: 8 }} disabled={busy || rating === 0} onClick={sendReview}>
                  Сохранить отзыв
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Пожаловаться на пользователя"
        targetUserId={profile.id}
      />
    </>
  );
}

export default function UserPage() {
  return <PageShell maxWidth={900}>{(ctx) => <UserBody ctx={ctx} />}</PageShell>;
}
