"use client";

import PageShell from "@/components/page-shell";
import ListingBrowser from "@/components/listing-browser";

export default function HousingPage() {
  return (
    <PageShell>
      {({ t }) => (
        <>
          <h1 className="page-title">{t.housingTitle}</h1>
          <p className="page-subtitle">{t.housingSubtitle}</p>
          <ListingBrowser fixedType="housing" adSlot="housing" />
        </>
      )}
    </PageShell>
  );
}
