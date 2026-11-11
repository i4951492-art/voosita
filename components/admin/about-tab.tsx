"use client";

import { useEffect, useState } from "react";
import {
  ABOUT_DEFAULT,
  ABOUT_KEY,
  DEFAULT_EMAIL,
  EMAIL_KEY,
  fetchSettings,
  saveSetting,
} from "@/lib/site";
import type { Locale } from "@/lib/i18n";
import { friendlyError } from "@/lib/util";

const LANGS: { id: Locale; label: string }[] = [
  { id: "uz-Latn", label: "O‘zbekcha (Lotin)" },
  { id: "uz-Cyrl", label: "Ўзбекча (Кирилл)" },
  { id: "ru", label: "Русский" },
];

export default function AboutTab() {
  const [locale, setLocale] = useState<Locale>("ru");
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [text, setText] = useState(ABOUT_DEFAULT.ru);
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    fetchSettings([...Object.values(ABOUT_KEY), EMAIL_KEY])
      .then((s) => {
        setSaved(s);
        if (s[EMAIL_KEY]) setEmail(s[EMAIL_KEY]);
        setText(s[ABOUT_KEY.ru] || ABOUT_DEFAULT.ru);
      })
      .catch((err) => setError(friendlyError(err)));
  }, []);

  const pick = (l: Locale) => {
    setLocale(l);
    setText(saved[ABOUT_KEY[l]] || ABOUT_DEFAULT[l]);
    setInfo("");
    setError("");
  };

  const run = async (fn: () => Promise<void>, done: string) => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await fn();
      setInfo(done);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const saveText = () =>
    run(async () => {
      await saveSetting(ABOUT_KEY[locale], text);
      setSaved((s) => ({ ...s, [ABOUT_KEY[locale]]: text }));
    }, "Текст сохранён");

  const saveEmail = () =>
    run(async () => {
      const value = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Введите корректный email");
      await saveSetting(EMAIL_KEY, value);
    }, "Email сохранён");

  return (
    <>
      <div className="vp-section">
        <h2>Текст раздела «О проекте»</h2>
        <div className="filters">
          {LANGS.map((l) => (
            <button key={l.id} type="button" className={`filter-chip ${locale === l.id ? "active" : ""}`} onClick={() => pick(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <textarea className="input" style={{ minHeight: 320, fontFamily: "inherit" }} maxLength={20000} value={text} onChange={(e) => setText(e.target.value)} />
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0" }}>
          Оформление: строка «# Заголовок» делает заголовок, строки «- пункт» делают список, пустая строка начинает новый абзац.
        </p>
        <div className="vp-actions">
          <button type="button" className="vp-btn vp-btn-primary" disabled={busy} onClick={saveText}>Сохранить текст</button>
          <button type="button" className="vp-btn" onClick={() => setText(ABOUT_DEFAULT[locale])}>Вернуть стандартный</button>
        </div>
      </div>

      <div className="vp-section">
        <h2>Email для рекламы и сотрудничества</h2>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="button" className="vp-btn vp-btn-primary" style={{ marginTop: 10 }} disabled={busy} onClick={saveEmail}>
          Сохранить email
        </button>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Показывается в «О проекте» и в окнах рекламы.</p>
      </div>

      {error && <div className="vp-error">{error}</div>}
      {info && <div style={{ color: "var(--blue)", fontSize: 14 }}>{info}</div>}
    </>
  );
}
