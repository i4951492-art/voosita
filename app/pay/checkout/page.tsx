"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function CheckoutInner() {
  const params = useSearchParams();
  const pid = params.get("pid") || "";
  const provider = params.get("provider") || "mock";
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<string>("");

  const pay = async (success: boolean) => {
    setLoading(true);
    try {
      // Simulate provider webhook → our server
      const res = await fetch("/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          providerPaymentId: `${provider}_${pid}`,
          status: success ? "success" : "failed",
          userId: "demo-user-1",
          planId: "pro_monthly",
          amountMinor: 9900000, // 99 000 so'm
        }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
      if (data.activated) setDone(true);
    } catch (e) {
      setResult(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f8ff",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 8px 30px rgba(16,38,74,0.08)",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          VOOSITA — To‘lov
        </h1>
        <p style={{ color: "#667895", fontSize: 14, marginBottom: 20 }}>
          Mock checkout (Click / Payme o‘rniga). Real kalitlar .env da.
        </p>
        <div
          style={{
            background: "#f6f8fc",
            borderRadius: 12,
            padding: 14,
            fontSize: 13,
            marginBottom: 20,
            wordBreak: "break-all",
          }}
        >
          Payment ID: <strong>{pid || "—"}</strong>
          <br />
          Provider: <strong>{provider}</strong>
          <br />
          Summa: <strong>99 000 so‘m</strong> (pro_monthly)
        </div>

        {!done ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => pay(true)}
              disabled={loading}
              style={{
                height: 48,
                borderRadius: 12,
                background: "#1674ef",
                color: "#fff",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              {loading ? "..." : "To‘lash (success)"}
            </button>
            <button
              onClick={() => pay(false)}
              disabled={loading}
              style={{
                height: 44,
                borderRadius: 12,
                background: "#fff",
                color: "#667895",
                fontWeight: 600,
                border: "1px solid #dce6f5",
                cursor: "pointer",
              }}
            >
              Bekor qilish (failed)
            </button>
          </div>
        ) : (
          <div
            style={{
              background: "#e8f8f0",
              color: "#079b85",
              padding: 16,
              borderRadius: 12,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            ✓ Obuna faollashtirildi (server webhook)
          </div>
        )}

        {result && (
          <pre
            style={{
              marginTop: 16,
              fontSize: 11,
              background: "#101c2d",
              color: "#9aafc8",
              padding: 12,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {result}
          </pre>
        )}

        <Link
          href="/pricing"
          style={{
            display: "block",
            marginTop: 16,
            textAlign: "center",
            fontSize: 13,
            color: "#1674ef",
            fontWeight: 600,
          }}
        >
          ← Tariflarga qaytish
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <CheckoutInner />
    </Suspense>
  );
}
