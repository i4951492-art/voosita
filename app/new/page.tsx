"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/page-shell";
import PhotoUploader from "@/components/photo-uploader";
import {
  CATEGORIES,
  DEAL_LABEL,
  MAX_LISTING_PHOTOS,
  TYPE_META,
  createListing,
  fetchListing,
  updateListing,
  type Deal,
  type ListingInput,
  type ListingType,
} from "@/lib/listings";
import { friendlyError, getQueryParam, UUID_RE } from "@/lib/util";
import type { User } from "@/lib/store";

type Form = {
  type: ListingType;
  category: string;
  title: string;
  description: string;
  city: string;
  price: string;
  rooms: string;
  deal: Deal;
  photoUrls: string[];
  publish: boolean;
};

const EMPTY: Form = {
  type: "job", category: "", title: "", description: "", city: "",
  price: "", rooms: "", deal: "rent", photoUrls: [], publish: true,
};

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="vp-field">
      <span>{label}</span>
      {children}
      {error && <small className="vp-error">{error}</small>}
    </label>
  );
}

function NewBody({ user }: { user: User }) {
  const router = useRouter();
  const [editId, setEditId] = useState("");
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const type = getQueryParam("type") as ListingType;
    const edit = getQueryParam("edit");
    if (type in TYPE_META) setForm((f) => ({ ...f, type }));
    if (!UUID_RE.test(edit)) {
      setLoading(false);
      return;
    }
    setEditId(edit);
    fetchListing(edit)
      .then((l) => {
        if (!l || l.ownerId !== user.id) throw new Error("Объявление не найдено");
        setForm({
          type: l.type,
          category: l.category ?? "",
          title: l.title,
          description: l.description ?? "",
          city: l.city ?? "",
          price: l.price === null ? "" : String(l.price),
          rooms: l.rooms === null ? "" : String(l.rooms),
          deal: l.deal ?? "rent",
          photoUrls: l.photoUrls,
          publish: l.status === "active",
        });
      })
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, [user.id]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const n = { ...e };
      delete n[key as string];
      return n;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const title = form.title.trim();
    if (title.length < 3 || title.length > 120) e.title = "Заголовок от 3 до 120 символов";
    if (!form.category) e.category = "Выберите категорию";
    if (form.description.length > 3000) e.description = "Не больше 3000 символов";
    if (form.price.trim() !== "" && !(Number(form.price) >= 0)) e.price = "Введите число";
    if (form.type === "housing" && form.rooms.trim() !== "") {
      const r = Number(form.rooms);
      if (!Number.isInteger(r) || r < 0 || r > 20) e.rooms = "От 0 до 20";
    }
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setError("Проверьте отмеченные поля");
      return;
    }
    const input: ListingInput = {
      type: form.type,
      category: form.category,
      title: form.title,
      description: form.description,
      city: form.city,
      price: form.price.trim() === "" ? null : Math.round(Number(form.price)),
      rooms: form.rooms.trim() === "" ? null : Number(form.rooms),
      deal: form.type === "housing" ? form.deal : null,
      photoUrls: form.photoUrls,
      status: form.publish ? "active" : "hidden",
    };
    setSaving(true);
    try {
      const id = editId ? (await updateListing(editId, input), editId) : await createListing(input);
      router.push(`/listing?id=${id}`);
    } catch (err) {
      setError(friendlyError(err));
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: "var(--muted)" }}>Загрузка…</p>;

  return (
    <form onSubmit={submit}>
      {!editId && (
        <div className="vp-section">
          <h2>Что размещаете?</h2>
          <div className="filters" style={{ marginBottom: 0 }}>
            {(Object.keys(TYPE_META) as ListingType[]).map((tp) => (
              <button
                key={tp}
                type="button"
                className={`filter-chip ${form.type === tp ? "active" : ""}`}
                onClick={() => setForm((f) => ({ ...f, type: tp, category: "" }))}
              >
                {tp === "job" ? "Вакансия" : tp === "service" ? "Услугу" : "Жильё"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="vp-section">
        <h2>Описание</h2>
        <Field label="Заголовок *" error={errors.title}>
          <input className="input" value={form.title} maxLength={120} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Категория *" error={errors.category}>
          <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Выберите</option>
            {CATEGORIES[form.type].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        {form.type === "housing" && (
          <div className="vp-two">
            <Field label="Сделка">
              <select className="input" value={form.deal} onChange={(e) => set("deal", e.target.value as Deal)}>
                <option value="rent">{DEAL_LABEL.rent}</option>
                <option value="sale">{DEAL_LABEL.sale}</option>
              </select>
            </Field>
            <Field label="Комнат" error={errors.rooms}>
              <input className="input" type="number" min={0} max={20} inputMode="numeric" value={form.rooms} onChange={(e) => set("rooms", e.target.value)} />
            </Field>
          </div>
        )}
        <div className="vp-two">
          <Field label="Город">
            <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Ташкент" />
          </Field>
          <Field label={TYPE_META[form.type].priceLabel} error={errors.price}>
            <input className="input" type="number" min={0} inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Пусто = договорная" />
          </Field>
        </div>
        <Field label="Подробности" error={errors.description}>
          <textarea
            className="input"
            style={{ minHeight: 140 }}
            value={form.description}
            maxLength={3000}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Условия, требования, адрес, что включено в цену"
          />
        </Field>
        <small style={{ color: "var(--muted)" }}>{form.description.length} / 3000</small>
      </div>

      <div className="vp-section">
        <h2>Фото</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
          До {MAX_LISTING_PHOTOS} фото, каждое до 5 МБ. Первое будет на обложке.
        </p>
        <PhotoUploader
          bucket="listing-photos"
          folder={user.id}
          urls={form.photoUrls}
          max={MAX_LISTING_PHOTOS}
          onChange={(urls) => set("photoUrls", urls)}
        />
      </div>

      <div className="vp-section">
        <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={form.publish} onChange={(e) => set("publish", e.target.checked)} />
          Опубликовать сразу (иначе объявление будет скрыто)
        </label>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
          Размещение бесплатное. Связь с вами идёт через чат на сайте, телефон не показывается.
        </p>
      </div>

      {error && <div className="vp-error" style={{ marginBottom: 12 }}>{error}</div>}
      <button type="submit" className="vp-btn vp-btn-primary vp-btn-block" disabled={saving}>
        {saving ? "Сохранение…" : editId ? "Сохранить изменения" : "Опубликовать"}
      </button>
    </form>
  );
}

export default function NewListingPage() {
  return (
    <PageShell maxWidth={760}>
      {({ ready, user, openAuth }) => (
        <>
          <h1 className="page-title">Разместить объявление</h1>
          <p className="page-subtitle">Бесплатно: вакансии, услуги и жильё.</p>
          {!ready ? (
            <p style={{ color: "var(--muted)" }}>Загрузка…</p>
          ) : !user ? (
            <div className="vp-section">
              <p style={{ marginBottom: 12 }}>Чтобы разместить объявление, войдите или зарегистрируйтесь.</p>
              <button type="button" className="vp-btn vp-btn-primary" onClick={openAuth}>Войти</button>
            </div>
          ) : (
            <NewBody user={user} />
          )}
        </>
      )}
    </PageShell>
  );
}
