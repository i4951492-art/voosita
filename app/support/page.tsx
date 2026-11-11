"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/page-shell";
import { getOrCreateSupport } from "@/lib/chat";
import { friendlyError } from "@/lib/util";
import type { User } from "@/lib/store";

function OpenSupport({ user, openAuth, ready }: { user: User | null; openAuth: () => void; ready: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !user) return;
    getOrCreateSupport()
      .then((id) => router.replace(`/messages?c=${id}`))
      .catch((err) => setError(friendlyError(err)));
  }, [ready, user, router]);

  if (!ready) return <p style={{ color: "var(--muted)" }}>Загрузка…</p>;
  if (!user)
    return (
      <div className="vp-section">
        <p style={{ marginBottom: 12 }}>Чтобы написать в поддержку, войдите в аккаунт.</p>
        <button type="button" className="vp-btn vp-btn-primary" onClick={openAuth}>
          Войти
        </button>
      </div>
    );
  return error ? <div className="vp-error">{error}</div> : <p style={{ color: "var(--muted)" }}>Открываем чат с поддержкой…</p>;
}

export default function SupportPage() {
  return (
    <PageShell maxWidth={640}>
      {({ ready, user, openAuth }) => (
        <>
          <h1 className="page-title">Поддержка</h1>
          <p className="page-subtitle">Напишите администратору, мы ответим в чате.</p>
          <OpenSupport user={user} openAuth={openAuth} ready={ready} />
        </>
      )}
    </PageShell>
  );
}
