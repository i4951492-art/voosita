"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import PageShell from "@/components/page-shell";
import RichText from "@/components/rich-text";
import AdBanner from "@/components/ad-banner";
import { isAdmin } from "@/lib/store";
import { ABOUT_DEFAULT, ABOUT_KEY, DEFAULT_EMAIL, EMAIL_KEY, fetchSettings } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

function AboutBody({ locale }: { locale: Locale }) {
  const [text, setText] = useState<string>(ABOUT_DEFAULT[locale]);
  const [email, setEmail] = useState(DEFAULT_EMAIL);

  useEffect(() => {
    let alive = true;
    setText(ABOUT_DEFAULT[locale]);
    fetchSettings([ABOUT_KEY[locale], EMAIL_KEY])
      .then((s) => {
        if (!alive) return;
        if (s[ABOUT_KEY[locale]]) setText(s[ABOUT_KEY[locale]]);
        if (s[EMAIL_KEY]) setEmail(s[EMAIL_KEY]);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [locale]);

  return (
    <article style={{ lineHeight: 1.65, fontSize: 15, color: "var(--text-dark)" }}>
      <RichText text={text} />
      <a href={`mailto:${email}`} style={{ fontWeight: 800, fontSize: 16, color: "var(--blue)" }}>
        {email}
      </a>
    </article>
  );
}

export default function AboutPage() {
  return (
    <PageShell maxWidth={760}>
      {({ t, locale, user }) => (
        <>
          <Link href="/" className="vp-link" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ChevronLeft size={14} /> {t.backHome}
          </Link>
          <h1 className="page-title" style={{ margin: "16px 0 12px" }}>{t.about}</h1>
          {isAdmin(user) && (
            <Link href="/admin?tab=about" className="vp-btn" style={{ marginBottom: 12 }}>
              <Pencil size={14} /> Редактировать этот раздел
            </Link>
          )}
          <AdBanner slot="home" />
          <div style={{ height: 16 }} />
          <AboutBody locale={locale} />
        </>
      )}
    </PageShell>
  );
}
