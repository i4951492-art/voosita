"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/page-shell";
import AdsTab from "@/components/admin/ads-tab";
import AboutTab from "@/components/admin/about-tab";
import ReportsTab from "@/components/admin/reports-tab";
import UsersTab from "@/components/admin/users-tab";
import ListingsTab from "@/components/admin/listings-tab";
import { isAdmin } from "@/lib/store";
import { getQueryParam } from "@/lib/util";

const TABS = [
  { id: "ads", label: "Реклама" },
  { id: "about", label: "О проекте" },
  { id: "reports", label: "Жалобы" },
  { id: "users", label: "Пользователи" },
  { id: "listings", label: "Объявления" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function AdminBody() {
  const [tab, setTab] = useState<TabId>("ads");

  useEffect(() => {
    const t = getQueryParam("tab") as TabId;
    if (TABS.some((x) => x.id === t)) setTab(t);
  }, []);

  const pick = (id: TabId) => {
    setTab(id);
    window.history.replaceState(null, "", `/admin?tab=${id}`);
  };

  return (
    <>
      <div className="filters">
        {TABS.map((x) => (
          <button key={x.id} type="button" className={`filter-chip ${tab === x.id ? "active" : ""}`} onClick={() => pick(x.id)}>
            {x.label}
          </button>
        ))}
        <Link href="/messages" className="filter-chip">Чаты поддержки</Link>
      </div>
      {tab === "ads" && <AdsTab />}
      {tab === "about" && <AboutTab />}
      {tab === "reports" && <ReportsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "listings" && <ListingsTab />}
    </>
  );
}

export default function AdminPage() {
  return (
    <PageShell maxWidth={860}>
      {({ ready, user, openAuth }) => (
        <>
          <h1 className="page-title">Админ-панель</h1>
          {!ready ? (
            <p style={{ color: "var(--muted)" }}>Загрузка…</p>
          ) : !user ? (
            <div className="vp-section">
              <p style={{ marginBottom: 12 }}>Войдите в аккаунт администратора.</p>
              <button type="button" className="vp-btn vp-btn-primary" onClick={openAuth}>Войти</button>
            </div>
          ) : !isAdmin(user) ? (
            <div className="vp-notice">Доступ только для администратора.</div>
          ) : (
            <AdminBody />
          )}
        </>
      )}
    </PageShell>
  );
}
