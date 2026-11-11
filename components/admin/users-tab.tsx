"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { adminFetchUsers, adminSetBan, type AdminUser } from "@/lib/site";
import { formatDate, friendlyError } from "@/lib/util";

export default function UsersTab() {
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await adminFetchUsers(applied));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleBan = async (u: AdminUser) => {
    const msg = u.banned ? `Разблокировать «${u.name}»?` : `Заблокировать «${u.name}» и скрыть его объявления?`;
    if (!window.confirm(msg)) return;
    setBusy(u.id);
    setError("");
    try {
      await adminSetBan(u.id, !u.banned);
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
        <input className="input" placeholder="Имя или телефон" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="vp-btn vp-btn-primary">Найти</button>
      </form>
      {error && <div className="vp-error">{error}</div>}
      {loading && <p style={{ color: "var(--muted)" }}>Загрузка…</p>}
      {!loading && users.length === 0 && <div className="empty-state">Никого не найдено.</div>}
      {users.map((u) => (
        <div key={u.id} className="vp-section vp-row">
          <div style={{ minWidth: 0, flex: 1 }}>
            <Link href={`/user?id=${u.id}`} style={{ fontWeight: 700 }}>{u.name}</Link>
            {u.role === "admin" && <span className="vp-tag">админ</span>}
            {u.banned && <span className="vp-tag vp-tag-red">заблокирован</span>}
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {u.phone ?? "без телефона"} · с {formatDate(u.createdAt)}
            </div>
          </div>
          {u.role !== "admin" && (
            <button type="button" className={`vp-btn ${u.banned ? "" : "vp-btn-danger"}`} disabled={busy === u.id} onClick={() => toggleBan(u)}>
              {u.banned ? "Разблокировать" : "Заблокировать"}
            </button>
          )}
        </div>
      ))}
    </>
  );
}
