"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Locale, Copy } from "@/lib/i18n";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  t: Copy;
  locale: Locale;
}

export default function AuthModal({ open, onClose, t }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      mode === "login"
        ? `${t.submitLogin}: ${email} — ${t.comingSoon}`
        : `${t.submitRegister}: ${name} / ${email} — ${t.comingSoon}`
    );
    onClose();
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
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
          VOOSITA
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <>
              <input
                className="auth-input"
                type="text"
                placeholder={t.name}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className="auth-input"
                type="tel"
                placeholder={t.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}
          <input
            className="auth-input"
            type="email"
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" className="auth-submit">
            {mode === "login" ? t.submitLogin : t.submitRegister}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 13, textAlign: "center", color: "var(--text-muted)" }}>
          {mode === "login" ? t.noAccount : t.hasAccount}{" "}
          <button
            type="button"
            style={{ color: "var(--blue-bright)", fontWeight: 600 }}
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? t.register : t.login}
          </button>
        </p>
      </div>
    </>
  );
}
