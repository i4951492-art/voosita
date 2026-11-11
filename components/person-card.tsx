import Link from "next/link";
import { Star, UserRound } from "lucide-react";
import type { PublicProfile } from "@/lib/social";

export default function PersonCard({ p }: { p: PublicProfile }) {
  return (
    <Link href={`/user?id=${p.id}`} className="vp-card vp-person">
      <div className="vp-avatar">
        {p.photoUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photoUrls[0]} alt="" loading="lazy" />
        ) : (
          <UserRound size={28} color="var(--muted)" />
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ marginBottom: 2 }}>{p.name}</h3>
        <div className="vp-card-meta">{[p.city, p.skills.slice(0, 3).join(", ")].filter(Boolean).join(" · ")}</div>
        {p.reviewsCount > 0 && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 13 }}>
            <Star size={13} fill="#f5a623" color="#f5a623" /> {p.ratingAvg.toFixed(1)}
            <span style={{ color: "var(--muted)" }}>({p.reviewsCount})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
