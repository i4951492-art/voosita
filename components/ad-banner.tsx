"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchActiveAds, fetchPartnershipEmail, DEFAULT_EMAIL, type Ad, type AdSlotId } from "@/lib/site";
import { getCurrentUser, USER_EVENT, isAdmin } from "@/lib/store";

/**
 * Ad window for one page slot.
 * Shows an active ad uploaded by the admin, or a "your ad here" placeholder.
 */
export default function AdBanner({ slot }: { slot: AdSlotId }) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchActiveAds(slot)
      .then((list) => {
        if (!alive) return;
        setAd(list.length > 0 ? list[Math.floor(Math.random() * list.length)] : null);
      })
      .catch(() => undefined)
      .finally(() => alive && setLoaded(true));
    fetchPartnershipEmail().then((e) => alive && setEmail(e));
    const sync = () => setAdmin(isAdmin(getCurrentUser()));
    sync();
    window.addEventListener(USER_EVENT, sync);
    return () => {
      alive = false;
      window.removeEventListener(USER_EVENT, sync);
    };
  }, [slot]);

  if (!loaded) return <div className="vp-ad vp-ad-empty" aria-hidden style={{ minHeight: 88 }} />;

  if (!ad) {
    return (
      <div className="vp-ad vp-ad-empty">
        <span className="vp-ad-label">Reklama · Реклама</span>
        <strong>Здесь будет ваша реклама</strong>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          Разместить: <a href={`mailto:${email}`}>{email}</a>
        </span>
        {admin && (
          <Link href="/admin?tab=ads" className="vp-link" style={{ fontSize: 13 }}>
            Настроить рекламу
          </Link>
        )}
      </div>
    );
  }

  const content = (
    <>
      {ad.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.imageUrl} alt="" className="vp-ad-img" />
      )}
      <div style={{ minWidth: 0 }}>
        <span className="vp-ad-label">Reklama · Реклама</span>
        <strong style={{ display: "block" }}>{ad.title}</strong>
        {ad.body && <span style={{ fontSize: 13, color: "var(--muted)" }}>{ad.body}</span>}
      </div>
    </>
  );

  return ad.linkUrl ? (
    <a className="vp-ad vp-ad-filled" href={ad.linkUrl} target="_blank" rel="noopener noreferrer sponsored">
      {content}
    </a>
  ) : (
    <div className="vp-ad vp-ad-filled">{content}</div>
  );
}
