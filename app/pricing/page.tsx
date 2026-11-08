"use client";

import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    id: "basic_monthly",
    name: "Basic",
    price: "49 000",
    amountMinor: 4900000,
    features: ["5 e’lon / oy", "Oddiy profil", "Qidiruv"],
  },
  {
    id: "pro_monthly",
    name: "Pro",
    price: "99 000",
    amountMinor: 9900000,
    features: [
      "Cheksiz e’lonlar",
      "Yuqori profil",
      "Portfolio",
      "Prioritet qidiruv",
      "Pasport tekshiruvi",
    ],
    popular: true,
  },
  {
    id: "business_monthly",
    name: "Business",
    price: "249 000",
    amountMinor: 24900000,
    features: [
      "Hammasi Pro dan",
      "Komanda (5 user)",
      "API access",
      "Support 24/7",
    ],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const startPayment = async (planId: string, amountMinor: number) => {
    setLoading(planId);
    setError("");
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo-user-1",
          amountMinor,
          planId,
          description: `VOOSITA ${planId}`,
          provider: "mock",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Xatolik");
        return;
      }
      // Redirect to checkout
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f8ff",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Link
          href="/"
          style={{ fontSize: 13, color: "#1674ef", fontWeight: 600 }}
        >
          ← Bosh sahifa
        </Link>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            margin: "16px 0 8px",
            color: "#10264a",
          }}
        >
          Tariflar
        </h1>
        <p style={{ color: "#667895", marginBottom: 32 }}>
          Obuna faqat to‘lov tasdiqlangandan keyin serverda faollashadi.
        </p>

        {error && (
          <div
            style={{
              background: "#fee",
              color: "#c00",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                border: plan.popular
                  ? "2px solid #1674ef"
                  : "1px solid #dce6f5",
                boxShadow: "0 8px 25px rgba(16,38,74,0.06)",
                position: "relative",
              }}
            >
              {plan.popular && (
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 16,
                    background: "#1674ef",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 20,
                  }}
                >
                  Mashhur
                </span>
              )}
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#10264a" }}>
                {plan.name}
              </h2>
              <div style={{ margin: "12px 0 16px" }}>
                <span
                  style={{ fontSize: 28, fontWeight: 800, color: "#1674ef" }}
                >
                  {plan.price}
                </span>
                <span style={{ color: "#667895", fontSize: 14 }}> so‘m / oy</span>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 20px",
                  fontSize: 14,
                  color: "#667895",
                }}
              >
                {plan.features.map((f) => (
                  <li key={f} style={{ marginBottom: 8 }}>
                    ✓ {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => startPayment(plan.id, plan.amountMinor)}
                disabled={!!loading}
                style={{
                  width: "100%",
                  height: 46,
                  borderRadius: 12,
                  background: plan.popular ? "#1674ef" : "#10264a",
                  color: "#fff",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  opacity: loading === plan.id ? 0.7 : 1,
                }}
              >
                {loading === plan.id ? "..." : "Tanlash"}
              </button>
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: 32,
            fontSize: 12,
            color: "#667895",
            textAlign: "center",
          }}
        >
          To‘lov tizimlari: Click, Payme, Uzum (kalitlar faqat serverda).
          <br />
          Hozir ishlaydi mock-provider — real ulash uchun .env ni to‘ldiring.
        </p>
      </div>
    </main>
  );
}
