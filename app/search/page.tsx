"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/page-shell";
import ListingBrowser from "@/components/listing-browser";
import PersonCard from "@/components/person-card";
import { searchSpecialists, type PublicProfile } from "@/lib/social";

function SearchBody() {
  const [q, setQ] = useState<string | null>(null);
  const [people, setPeople] = useState<PublicProfile[]>([]);

  useEffect(() => {
    if (q === null) return;
    let alive = true;
    searchSpecialists(q)
      .then((list) => alive && setPeople(list))
      .catch(() => alive && setPeople([]));
    return () => {
      alive = false;
    };
  }, [q]);

  return (
    <>
      <h1 className="page-title">Поиск</h1>
      <p className="page-subtitle">Объявления и специалисты в одном месте.</p>

      {people.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Специалисты</h2>
          <div className="vp-grid">
            {people.map((p) => (
              <PersonCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Объявления</h2>
      <ListingBrowser adSlot="search" onQueryApplied={setQ} />
    </>
  );
}

export default function SearchPage() {
  return <PageShell>{() => <SearchBody />}</PageShell>;
}
