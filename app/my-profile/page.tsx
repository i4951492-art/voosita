"use client";

import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, Camera, X } from "lucide-react";
import SiteHeader from "@/components/site-header";
import AuthModal from "@/components/auth-modal";
import { copy, type Locale } from "@/lib/i18n";
import { getCurrentUser, setCurrentUser, type User } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  GOALS,
  EMPTY_PROFILE,
  fetchMyProfile,
  saveMyProfile,
  uploadPhoto,
  removePhoto,
  type Goal,
  type Profile,
} from "@/lib/profile";

const MAX_PHOTOS = 6;
const MAX_SKILLS = 15;
const MAX_BIO = 1000;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const parseSkills = (text: string) =>
  text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SKILLS);

const errText = (err: unknown) => (err instanceof Error ? err.message : String(err));

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: "var(--card, #fff)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: hint ? 4 : 12 }}>{title}</h2>
      {hint && <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{hint}</p>}
      {children}
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label}</span>
      {children}
      {error && <span style={{ display: "block", color: "#c0392b", fontSize: 12, marginTop: 4 }}>{error}</span>}
    </label>
  );
}

export default function MyProfilePage() {
  const [locale, setLocale] = useState<Locale>("uz-Latn");
  const [dark, setDark] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [skillsText, setSkillsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = copy[locale];

  useEffect(() => {
    const saved = localStorage.getItem("voosita_locale") as Locale | null;
    if (saved && copy[saved]) setLocale(saved);
    const d = localStorage.getItem("voosita_dark") === "1";
    setDark(d);
    document.documentElement.classList.toggle("dark", d);

    const u = getCurrentUser();
    setUser(u);
    if (!u) {
      setLoading(false);
      return;
    }
    fetchMyProfile()
      .then((p) => {
        if (p) {
          setProfile(p);
          setSkillsText(p.skills.join(", "));
        }
      })
      .catch((err) => setMessage({ type: "err", text: `Не удалось загрузить профиль: ${errText(err)}` }))
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  };

  const toggleGoal = (g: Goal) => {
    const has = profile.goals.includes(g);
    update("goals", has ? profile.goals.filter((x) => x !== g) : [...profile.goals, g]);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!profile.name.trim()) e.name = "Укажите имя";
    if (profile.goals.length === 0) e.goals = "Выберите хотя бы одну цель";
    if (profile.bio.length > MAX_BIO) e.bio = `Не больше ${MAX_BIO} символов`;
    if (
      profile.experienceYears !== null &&
      (profile.experienceYears < 0 || profile.experienceYears > 60)
    )
      e.experienceYears = "От 0 до 60 лет";
    if (profile.priceFrom !== null && profile.priceTo !== null && profile.priceFrom > profile.priceTo)
      e.priceFrom = "Минимум не может быть больше максимума";
    return e;
  };

  const handleSave = async () => {
    setMessage(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setMessage({ type: "err", text: "Проверьте отмеченные поля" });
      return;
    }
    setSaving(true);
    try {
      const toSave: Profile = { ...profile, skills: parseSkills(skillsText) };
      await saveMyProfile(toSave);
      setProfile(toSave);
      setSkillsText(toSave.skills.join(", "));
      const cur = getCurrentUser();
      if (cur) setCurrentUser({ ...cur, name: toSave.name, phone: toSave.phone || undefined });
      setMessage({ type: "ok", text: "Профиль сохранён" });
    } catch (err) {
      setMessage({ type: "err", text: `Не сохранилось: ${errText(err)}` });
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "err", text: "Выберите файл изображения" });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setMessage({ type: "err", text: "Фото больше 5 МБ" });
      return;
    }
    if (profile.photoUrls.length >= MAX_PHOTOS) return;
    setUploading(true);
    setMessage(null);
    try {
      const url = await uploadPhoto(file);
      setProfile((p) => ({ ...p, photoUrls: [...p.photoUrls, url] }));
    } catch (err) {
      setMessage({ type: "err", text: `Фото не загрузилось: ${errText(err)}` });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (url: string) => {
    setProfile((p) => ({ ...p, photoUrls: p.photoUrls.filter((u) => u !== url) }));
    removePhoto(url).catch(() => undefined);
  };

  const inputStyle = { width: "100%" } as const;

  return (
    <div className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SiteHeader
        t={t}
        locale={locale}
        dark={dark}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onLocaleChange={(l) => {
          setLocale(l);
          localStorage.setItem("voosita_locale", l);
        }}
      />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 80px" }}>
        <Link
          href="/settings"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--blue)", fontWeight: 600, marginBottom: 12 }}
        >
          <ChevronLeft size={16} /> Настройки
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Мой профиль</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
          Заполните анкету. Чем полнее, тем лучше вас найдут.
        </p>
        {user && (
          <Link href={`/user?id=${user.id}`} style={{ display: "inline-block", marginBottom: 16, color: "var(--blue)", fontWeight: 600, fontSize: 14 }}>
            Посмотреть, как видят мой профиль другие
          </Link>
        )}

        {!isSupabaseConfigured && (
          <div style={{ color: "#c0392b", marginBottom: 16 }}>База данных не подключена.</div>
        )}

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Загрузка…</p>
        ) : !user ? (
          <div style={{ padding: 24, border: "1px solid var(--line)", borderRadius: 14 }}>
            <p style={{ marginBottom: 12 }}>Чтобы заполнить профиль, войдите в аккаунт.</p>
            <button
              className="pill-btn"
              style={{ background: "var(--blue)", color: "#fff" }}
              onClick={() => setAuthOpen(true)}
            >
              {t.login}
            </button>
          </div>
        ) : (
          <>
            <Section title="Цель на сайте" hint="Можно выбрать несколько вариантов.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {GOALS.map((g) => {
                  const active = profile.goals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGoal(g.id)}
                      className="pill-btn"
                      style={{
                        border: "1px solid var(--line)",
                        background: active ? "var(--blue)" : "transparent",
                        color: active ? "#fff" : "var(--text-dark)",
                      }}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
              {errors.goals && <div style={{ color: "#c0392b", fontSize: 12, marginTop: 8 }}>{errors.goals}</div>}
            </Section>

            <Section title="Основное">
              <Field label="Имя или название *" error={errors.name}>
                <input className="input" style={inputStyle} value={profile.name} onChange={(e) => update("name", e.target.value)} />
              </Field>
              <Field label="Город">
                <input className="input" style={inputStyle} value={profile.city} onChange={(e) => update("city", e.target.value)} placeholder="Ташкент" />
              </Field>
              <Field label="Телефон (виден только вам и администратору)">
                <input className="input" style={inputStyle} type="tel" value={profile.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+998" />
              </Field>
            </Section>

            <Section title="Фото" hint={`До ${MAX_PHOTOS} фото, каждое до 5 МБ. Первое фото будет главным.`}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {profile.photoUrls.map((url) => (
                  <div key={url} style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(url)}
                      aria-label="Удалить фото"
                      style={{ position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: 14, border: "none", background: "rgba(0,0,0,0.6)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {profile.photoUrls.length < MAX_PHOTOS && (
                  <label style={{ aspectRatio: "1 / 1", borderRadius: 12, border: "1px dashed var(--line)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: uploading ? "wait" : "pointer", color: "var(--muted)", fontSize: 13 }}>
                    <Camera size={22} />
                    {uploading ? "Загрузка…" : "Добавить"}
                    <input type="file" accept="image/*" onChange={handlePhoto} disabled={uploading} style={{ display: "none" }} />
                  </label>
                )}
              </div>
            </Section>

            <Section title="О себе">
              <Field label="Описание" error={errors.bio}>
                <textarea
                  className="input"
                  style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                  value={profile.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  placeholder="Расскажите о себе, опыте, что умеете или что ищете"
                />
              </Field>
              <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "right", marginTop: -6 }}>
                {profile.bio.length} / {MAX_BIO}
              </div>
            </Section>

            <Section title="Навыки и опыт">
              <Field label={`Навыки через запятую (до ${MAX_SKILLS})`}>
                <input
                  className="input"
                  style={inputStyle}
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="React, Next.js, Figma"
                />
              </Field>
              <Field label="Опыт, лет" error={errors.experienceYears}>
                <input
                  className="input"
                  style={inputStyle}
                  type="number"
                  min={0}
                  max={60}
                  inputMode="numeric"
                  value={profile.experienceYears ?? ""}
                  onChange={(e) => update("experienceYears", e.target.value === "" ? null : Number(e.target.value))}
                />
              </Field>
            </Section>

            <Section title="Оплата, сум" hint="Зарплата, ставка за услугу или стоимость аренды. Можно оставить пустым.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="От" error={errors.priceFrom}>
                  <input
                    className="input"
                    style={inputStyle}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={profile.priceFrom ?? ""}
                    onChange={(e) => update("priceFrom", e.target.value === "" ? null : Number(e.target.value))}
                  />
                </Field>
                <Field label="До">
                  <input
                    className="input"
                    style={inputStyle}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={profile.priceTo ?? ""}
                    onChange={(e) => update("priceTo", e.target.value === "" ? null : Number(e.target.value))}
                  />
                </Field>
              </div>
            </Section>

            <Section title="Видимость">
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={profile.isPublic} onChange={(e) => update("isPublic", e.target.checked)} />
                Показывать анкету всем посетителям сайта (телефон не показывается)
              </label>
            </Section>

            {message && (
              <div style={{ color: message.type === "ok" ? "var(--blue)" : "#c0392b", fontSize: 14, marginBottom: 12 }}>
                {message.text}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className="pill-btn"
              style={{ width: "100%", height: 48, justifyContent: "center", background: "var(--blue)", color: "#fff", fontWeight: 700, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Сохранение…" : "Сохранить профиль"}
            </button>
          </>
        )}
      </main>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        t={t}
        onAuth={() => {
          const u = getCurrentUser();
          setUser(u);
          if (u) fetchMyProfile().then((p) => p && (setProfile(p), setSkillsText(p.skills.join(", ")))).catch(() => undefined);
        }}
      />
    </div>
  );
}
