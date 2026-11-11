"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { REPORT_REASONS, submitReport, type ReportReason } from "@/lib/social";
import { friendlyError } from "@/lib/util";

export default function ReportDialog({
  open,
  onClose,
  title,
  targetUserId,
  listingId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  targetUserId?: string;
  listingId?: string;
}) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const close = () => {
    setDone(false);
    setError("");
    setDetails("");
    onClose();
  };

  const send = async () => {
    setBusy(true);
    setError("");
    try {
      await submitReport({ targetUserId, listingId, reason, details });
      setDone(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="overlay open" onClick={close} />
      <div className="about-pop open" style={{ maxWidth: 420 }} role="dialog" aria-modal="true">
        <button className="close-btn" onClick={close} aria-label="Закрыть">
          <X size={16} />
        </button>
        <h3 style={{ marginBottom: 12 }}>{title}</h3>
        {done ? (
          <>
            <p style={{ marginBottom: 16 }}>Жалоба отправлена. Администратор рассмотрит её.</p>
            <button type="button" className="vp-btn vp-btn-primary" onClick={close}>
              Закрыть
            </button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {REPORT_REASONS.map((r) => (
                <label key={r.id} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                  <input type="radio" name="reason" checked={reason === r.id} onChange={() => setReason(r.id)} />
                  {r.label}
                </label>
              ))}
            </div>
            <textarea
              className="input"
              style={{ minHeight: 90 }}
              placeholder="Подробности (необязательно)"
              maxLength={1000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
            {error && <div className="vp-error">{error}</div>}
            <button
              type="button"
              className="vp-btn vp-btn-primary"
              style={{ marginTop: 12 }}
              disabled={busy}
              onClick={send}
            >
              {busy ? "Отправка…" : "Отправить жалобу"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
