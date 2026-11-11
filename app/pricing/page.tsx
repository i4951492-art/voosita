"use client";

import Link from "next/link";

export default function PricingPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f5f8ff", fontFamily: "Inter, system-ui, sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <Link href="/" style={{ fontSize: 13, color: "#1674ef", fontWeight: 600 }}>← Bosh sahifa</Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "16px 0 12px", color: "#10264a" }}>
          Hammasi bepul
        </h1>
        <p style={{ color: "#667895", lineHeight: 1.6, marginBottom: 24 }}>
          VOOSITA WORK da pullik tariflar yo‘q. Ro‘yxatdan o‘ting, e’lon joylang,
          chatda yozishingiz mumkin — to‘lov talab qilinmaydi.
        </p>
        <Link
          href="/settings"
          style={{
            display: "inline-block",
            padding: "12px 20px",
            borderRadius: 12,
            background: "#1674ef",
            color: "#fff",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Sozlamalar / Ro‘yxatdan o‘tish
        </Link>
      </div>
    </main>
  );
}
