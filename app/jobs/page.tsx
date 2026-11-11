"use client";

import PageShell from "@/components/page-shell";
import ListingBrowser from "@/components/listing-browser";

export default function JobsPage() {
  return (
    <PageShell>
      {({ t }) => (
        <>
          <h1 className="page-title">{t.jobsTitle}</h1>
          <p className="page-subtitle">{t.jobsSubtitle}</p>
          <ListingBrowser fixedType="job" adSlot="jobs" />
        </>
      )}
    </PageShell>
  );
}
