"use client";

import { Star } from "lucide-react";

/** Read-only stars when onChange is not given; clickable input otherwise. */
export default function Stars({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const rounded = Math.round(value);
  return (
    <span style={{ display: "inline-flex", gap: 2 }} aria-label={`Оценка ${value.toFixed(1)} из 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= rounded;
        const icon = (
          <Star
            size={size}
            fill={filled ? "#f5a623" : "none"}
            color={filled ? "#f5a623" : "var(--muted)"}
          />
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n}`}
            style={{ background: "none", border: "none", padding: 2, cursor: "pointer" }}
          >
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </span>
  );
}
