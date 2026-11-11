import Link from "next/link";
import { Star } from "lucide-react";
import { TYPE_META, formatPrice, type Listing } from "@/lib/listings";
import type { PublicProfile } from "@/lib/social";

export default function ListingCard({ l, owner }: { l: Listing; owner?: PublicProfile }) {
  const meta = [l.category, l.type === "housing" && l.rooms ? `${l.rooms} комн.` : null, l.city]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link href={`/listing?id=${l.id}`} className="vp-card">
      <div className="vp-card-img">
        {l.photoUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.photoUrls[0]} alt="" loading="lazy" />
        ) : (
          <div className="vp-card-noimg">{TYPE_META[l.type].label}</div>
        )}
      </div>
      <div className="vp-card-body">
        <div className="vp-card-price">{formatPrice(l)}</div>
        <h3>{l.title}</h3>
        {meta && <div className="vp-card-meta">{meta}</div>}
        {owner && (
          <div className="vp-card-owner">
            {owner.name}
            {owner.reviewsCount > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 2, marginLeft: 8 }}>
                <Star size={12} fill="#f5a623" color="#f5a623" /> {owner.ratingAvg.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
