"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminFetchReports,
  adminSetBan,
  adminSetReportStatus,
  type AdminReport,
} from "@/lib/site";
import { fetchListing, setListingStatus } from "@/lib/listings";
import { REPORT_REASONS, fetchPublicProfiles, type PublicProfile } from "@/lib/social";
import { formatDate, friendlyError } from "@/lib/util";

export default function ReportsTab() {
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [names, setNames] = useState<Record<string, PublicProfile>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await adminFetchReports(onlyOpen);
      setReports(list);
      const userIds = list.flatMap((r) => [r.reporterId, r.targetUserId]).filter((x): x is string => Boolean(x));
      setNames(await fetchPublicProfiles(userIds).catch(() => ({})));
      const found: Record<string, string> = {};
      await Promise.all(
        Array.from(new Set(list.map((r) => r.listingId).filter((x): x is string => Boolean(x)))).map(async (id) => {
          const l = await fetchListing(id).catch(() => null);
          found[id] = l ? l.title : "(объявление удалено)";
        })
      );
      setTitles(found);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [onlyOpen]);

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

  const reasonLabel = (r: string) => REPORT_REASONS.find((x) => x.id === r)?.label ?? r;
  const nameOf = (id: string | null) => (id ? names[id]?.name ?? "Пользователь (скрыт или заблокирован)" : "");

  return (
    <>
      <div className="filters">
        <button type="button" className={`filter-chip ${onlyOpen ? "active" : ""}`} onClick={() => setOnlyOpen(true)}>Открытые</button>
        <button type="button" className={`filter-chip ${!onlyOpen ? "active" : ""}`} onClick={() => setOnlyOpen(false)}>Все</button>
      </div>
      {error && <div className="vp-error">{error}</div>}
      {loading && <p style={{ color: "var(--muted)" }}>Загрузка…</p>}
      {!loading && reports.length === 0 && <div className="empty-state">Жалоб нет.</div>}

      {reports.map((r) => (
        <div key={r.id} className="vp-section">
          <div className="vp-row">
            <strong>{reasonLabel(r.reason)}</strong>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {formatDate(r.createdAt)} · {r.status === "open" ? "открыта" : r.status === "resolved" ? "решена" : "отклонена"}
            </span>
          </div>
          {r.details && <p style={{ whiteSpace: "pre-wrap", margin: "8px 0" }}>{r.details}</p>}
          <p style={{ fontSize: 13 }}>
            От: <Link href={`/user?id=${r.reporterId}`} className="vp-link">{nameOf(r.reporterId)}</Link>
          </p>
          {r.targetUserId && (
            <p style={{ fontSize: 13 }}>
              На пользователя: <Link href={`/user?id=${r.targetUserId}`} className="vp-link">{nameOf(r.targetUserId)}</Link>
            </p>
          )}
          {r.listingId && (
            <p style={{ fontSize: 13 }}>
              На объявление: <Link href={`/listing?id=${r.listingId}`} className="vp-link">{titles[r.listingId] ?? "…"}</Link>
            </p>
          )}
          {r.status === "open" && (
            <div className="vp-actions" style={{ marginTop: 10 }}>
              <button type="button" className="vp-btn" disabled={busy === r.id} onClick={() => act(r.id, () => adminSetReportStatus(r.id, "resolved"))}>Решена</button>
              <button type="button" className="vp-btn" disabled={busy === r.id} onClick={() => act(r.id, () => adminSetReportStatus(r.id, "dismissed"))}>Отклонить</button>
              {r.targetUserId && (
                <button
                  type="button"
                  className="vp-btn vp-btn-danger"
                  disabled={busy === r.id}
                  onClick={() => {
                    if (!window.confirm("Заблокировать этот аккаунт и скрыть его объявления?")) return;
                    void act(r.id, async () => {
                      await adminSetBan(r.targetUserId as string, true);
                      await adminSetReportStatus(r.id, "resolved");
                    });
                  }}
                >
                  Забанить пользователя
                </button>
              )}
              {r.listingId && (
                <button
                  type="button"
                  className="vp-btn vp-btn-danger"
                  disabled={busy === r.id}
                  onClick={() =>
                    act(r.id, async () => {
                      await setListingStatus(r.listingId as string, "removed");
                      await adminSetReportStatus(r.id, "resolved");
                    })
                  }
                >
                  Снять объявление
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
