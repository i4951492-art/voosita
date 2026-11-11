"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Copy, Locale } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase";
import { loginUser, registerUser } from "@/lib/store";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  t: Copy;
  locale?: Locale;
  onAuth?: () => void;
}

function explainError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === "NOT_CONFIGURED")
    return "Вход временно недоступен: база данных не подключена / Кириш вақтинча мавжуд эмас";
  if (msg.includes("Invalid login credentials"))
    return "Неверный email или пароль / Email ёки парол нотўғри";
  if (msg.includes("already registered"))
    return "Email уже занят / Email банд";
  if (msg.includes("at least 6"))
    return "Пароль минимум 6 символов / Парол камида 6 белги";
  if (msg.includes("Email not confirmed"))
    return "Подтвердите email по ссылке из письма / Почтани тасдиқланг";
  if (msg.includes("valid email") || msg.includes("Unable to validate email"))
    return "Введите корректный email / Тўғри email киритинг";
  if (msg === "BANNED")
    return "Аккаунт заблокирован. Обратитесь в поддержку / Аккаунт блокланган";
  if (msg === "PROFILE_NOT_FOUND")
    return "Профиль не найден, обратитесь в поддержку / Профиль топилмади";
  return "Ошибка: " + msg;
}

export default function AuthModal({ open, onClose, t, onAuth }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!isSupabaseConfigured) {
      setError(explainError(new Error("NOT_CONFIGURED")));
      return;
    }
    if (!email.trim() || !password.trim() || (mode === "register" && !name.trim())) {
      setError("To‘ldiring / Заполните поля");
      return;
    }

    setBusy(true);
    try {
      if (mode === "register") {
        const result = await registerUser({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
        });
        if (result.needsConfirmation) {
          setInfo("Письмо отправлено. Подтвердите email и войдите / Почтани тасдиқланг ва кириң");
          setMode("login");
          setPassword("");
          return;
        }
      } else {
        await loginUser(email.trim(), password);
      }
      onAuth?.();
      onClose();
    } catch (err) {
      setError(explainError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="overlay open" onClick={onClose} />
      <div className="about-pop open" style={{ maxWidth: 400 }}>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <h3 style={{ marginBottom: 6 }}>
          {mode === "login" ? t.login : t.register}
        </h3>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
          Bepul · Бесплатно · Ҳаммаси бепул
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {mode === "register" && (
            <>
              <input
                className="input"
                placeholder={t.name}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="input"
                placeholder={t.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}
          <input
            className="input"
            type="email"
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="input"
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {error && <div style={{ color: "#c0392b", fontSize: 13 }}>{error}</div>}
          {info && <div style={{ color: "var(--blue)", fontSize: 13 }}>{info}</div>}
          <button
            type="submit"
            className="pill-btn"
            disabled={busy}
            style={{ background: "var(--blue)", color: "#fff", height: 44, opacity: busy ? 0.6 : 1 }}
          >
            {mode === "login" ? t.submitLogin : t.submitRegister}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setInfo("");
          }}
          style={{
            marginTop: 14,
            background: "none",
            border: "none",
            color: "var(--blue)",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {mode === "login" ? t.noAccount : t.hasAccount}
        </button>
      </div>
    </>
  );
}
