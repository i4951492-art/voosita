"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, CheckCheck, ChevronLeft, Send } from "lucide-react";
import PageShell from "@/components/page-shell";
import {
  fetchConversation,
  fetchConversations,
  fetchMessages,
  markRead,
  sendMessage,
  type Conversation,
  type Message,
} from "@/lib/chat";
import { fetchPublicProfiles, type PublicProfile } from "@/lib/social";
import { isAdmin, type User } from "@/lib/store";
import { formatTime, friendlyError, getQueryParam, UUID_RE } from "@/lib/util";

function Chat({ user }: { user: User }) {
  const admin = isAdmin(user);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [people, setPeople] = useState<Record<string, PublicProfile>>({});
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(async (wanted?: string) => {
    const list = await fetchConversations();
    let all = list;
    if (wanted && !list.some((c) => c.id === wanted)) {
      const one = await fetchConversation(wanted).catch(() => null);
      if (one) all = [one, ...list];
    }
    setConvs(all);
    const ids = all.flatMap((c) => [c.userA, c.userB]).filter((x): x is string => Boolean(x) && x !== user.id);
    fetchPublicProfiles(ids)
      .then((m) => setPeople((prev) => ({ ...prev, ...m })))
      .catch(() => undefined);
  }, [user.id]);

  // First load and refresh of the list
  useEffect(() => {
    const wanted = getQueryParam("c");
    const initial = UUID_RE.test(wanted) ? wanted : "";
    if (initial) setActiveId(initial);
    loadConvs(initial || undefined)
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
    const id = window.setInterval(() => {
      if (!document.hidden) loadConvs().catch(() => undefined);
    }, 10000);
    return () => window.clearInterval(id);
  }, [loadConvs]);

  // Messages of the open conversation, refreshed every 4 seconds
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const list = await fetchMessages(activeId);
        if (!alive) return;
        setMessages(list);
        if (list.some((m) => m.senderId !== user.id && !m.readAt)) void markRead(activeId);
      } catch (err) {
        if (alive) setError(friendlyError(err));
      }
    };
    void load();
    const id = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 4000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [activeId, user.id]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, activeId]);

  const open = (id: string) => {
    setActiveId(id);
    setError("");
    window.history.replaceState(null, "", `/messages?c=${id}`);
  };

  const close = () => {
    setActiveId("");
    window.history.replaceState(null, "", "/messages");
  };

  const titleOf = (c: Conversation) => {
    if (c.kind === "support") {
      return admin ? `Поддержка: ${people[c.userA]?.name ?? "пользователь"}` : "Поддержка VOOSITA WORK";
    }
    const other = c.userA === user.id ? c.userB : c.userA;
    return (other && people[other]?.name) || "Пользователь";
  };

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!activeId || sending || !text.trim()) return;
    setSending(true);
    setError("");
    try {
      const m = await sendMessage(activeId, text);
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      setText("");
      void loadConvs();
    } catch (err) {
      setError(friendlyError(err) + ". Возможно, пользователь ограничил переписку.");
    } finally {
      setSending(false);
    }
  };

  const active = convs.find((c) => c.id === activeId);
  const otherId = active && active.kind === "direct" ? (active.userA === user.id ? active.userB : active.userA) : null;

  return (
    <div className={`vp-chat ${activeId ? "has-active" : ""}`}>
      <div className="vp-chat-list">
        {loading && <p style={{ padding: 16, color: "var(--muted)" }}>Загрузка…</p>}
        {!loading && convs.length === 0 && (
          <div className="empty-state" style={{ padding: 24 }}>
            Переписок пока нет. Откройте объявление или профиль и нажмите «Написать».
            <div style={{ marginTop: 12 }}><Link href="/support" className="vp-link">Написать в поддержку</Link></div>
          </div>
        )}
        {convs.map((c) => (
          <button key={c.id} type="button" className={`vp-chat-item ${c.id === activeId ? "on" : ""}`} onClick={() => open(c.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titleOf(c)}</strong>
              <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>{formatTime(c.lastMessageAt)}</span>
            </div>
            <span style={{ fontSize: 13, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
              {c.lastMessage ?? "Нет сообщений"}
            </span>
          </button>
        ))}
      </div>

      <div className="vp-chat-thread">
        {!active ? (
          <div className="empty-state" style={{ margin: "auto" }}>Выберите переписку слева</div>
        ) : (
          <>
            <div className="vp-chat-head">
              <button type="button" className="vp-btn vp-chat-back" onClick={close} aria-label="Назад к списку">
                <ChevronLeft size={16} />
              </button>
              <div style={{ minWidth: 0 }}>
                <strong>{titleOf(active)}</strong>
                <div style={{ fontSize: 12 }}>
                  {otherId && <Link href={`/user?id=${otherId}`} className="vp-link">Профиль</Link>}
                  {active.listingId && <> · <Link href={`/listing?id=${active.listingId}`} className="vp-link">Объявление</Link></>}
                </div>
              </div>
            </div>

            <div className="vp-chat-messages">
              {messages.length === 0 && <p style={{ color: "var(--muted)", textAlign: "center" }}>Напишите первое сообщение</p>}
              {messages.map((m) => {
                const mine = m.senderId === user.id;
                return (
                  <div key={m.id} className={`vp-bubble ${mine ? "mine" : ""}`}>
                    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.body}</div>
                    <div className="vp-bubble-time">
                      {formatTime(m.createdAt)}
                      {mine && (m.readAt ? <CheckCheck size={12} /> : <Check size={12} />)}
                    </div>
                  </div>
                );
              })}
              <div ref={bottom} />
            </div>

            {error && <div className="vp-error" style={{ padding: "0 12px" }}>{error}</div>}
            <form onSubmit={send} className="vp-chat-form">
              <textarea
                className="input"
                rows={1}
                maxLength={2000}
                placeholder="Сообщение"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void send();
                }}
              />
              <button type="submit" className="vp-btn vp-btn-primary" disabled={sending || !text.trim()} aria-label="Отправить">
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <PageShell maxWidth={1100}>
      {({ ready, user, openAuth }) => (
        <>
          <h1 className="page-title">Сообщения</h1>
          {!ready ? (
            <p style={{ color: "var(--muted)" }}>Загрузка…</p>
          ) : !user ? (
            <div className="vp-section">
              <p style={{ marginBottom: 12 }}>Войдите, чтобы переписываться с пользователями.</p>
              <button type="button" className="vp-btn vp-btn-primary" onClick={openAuth}>Войти</button>
            </div>
          ) : (
            <Chat user={user} />
          )}
        </>
      )}
    </PageShell>
  );
}
