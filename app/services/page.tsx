"use client";

import PageShell from "@/components/page-shell";
import ListingBrowser from "@/components/listing-browser";

export default function ServicesPage() {
  return (
    <PageShell>
      {({ t }) => (
        <>
          <h1 className="page-title">{t.servicesTitle}</h1>
          <p className="page-subtitle">{t.servicesSubtitle}</p>
          <ListingBrowser fixedType="service" adSlot="services" />
        </>
      )}
    </PageShell>
  );
}
