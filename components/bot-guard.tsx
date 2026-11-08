"use client";

import { useEffect, useState } from "react";
import { collectBotSignals, BOT_THRESHOLD } from "@/lib/bot-detect";

/**
 * Runs once on first visit.
 * If bot score is high — shows soft challenge / warning.
 * Stores fingerprint in localStorage so we don't re-check every page load.
 */
export default function BotGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [challengePassed, setChallengePassed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("voosita-fp");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.ok && Date.now() - data.ts < 7 * 24 * 60 * 60 * 1000) {
          setReady(true);
          return;
        }
      } catch {}
    }

    (async () => {
      const signals = await collectBotSignals();
      // Soft log (in real app → send to server)
      console.info("[VOOSITA bot-check]", signals);

      if (signals.score >= BOT_THRESHOLD) {
        setBlocked(true);
      } else {
        localStorage.setItem(
          "voosita-fp",
          JSON.stringify({
            ok: true,
            hash: signals.fingerprintHash,
            score: signals.score,
            ts: Date.now(),
          })
        );
      }
      setReady(true);
    })();
  }, []);

  const passChallenge = () => {
    localStorage.setItem(
      "voosita-fp",
      JSON.stringify({ ok: true, hash: "challenge", score: 0, ts: Date.now() })
    );
    setChallengePassed(true);
    setBlocked(false);
  };

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f8ff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", color: "#667895" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>VOOSITA</div>
          <div style={{ fontSize: 14 }}>Tekshirilmoqda… / Checking…</div>
        </div>
      </div>
    );
  }

  if (blocked && !challengePassed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#101c2d",
          color: "#e8eef8",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 400,
            width: "100%",
            background: "#1a2b42",
            borderRadius: 16,
            padding: 28,
            textAlign: "center",
            border: "1px solid #2a3f5c",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            VOOSITA
          </div>
          <p style={{ fontSize: 14, color: "#9aafc8", marginBottom: 20, lineHeight: 1.5 }}>
            Biz avtomatik tizimlarni aniqladik. Iltimos, odam ekanligingizni
            tasdiqlang.
            <br />
            <span style={{ opacity: 0.8 }}>
              We detected automated traffic. Please confirm you are human.
            </span>
          </p>
          <button
            onClick={passChallenge}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              background: "#1674ef",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              cursor: "pointer",
            }}
          >
            Men odamman / I am human
          </button>
          <p style={{ fontSize: 11, color: "#667895", marginTop: 14 }}>
            Fingerprint check · first visit only
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
