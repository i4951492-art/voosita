"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import PhotoUploaderNote from "./note";
import {
  AD_SLOTS,
  createAd,
  deleteAd,
  fetchAllAds,
  setAdActive,
  updateAd,
  type Ad,
  type AdInput,
  type AdSlotId,
} from "@/lib/site";
import { uploadImage, validateImage } from "@/lib/storage";
import { friendlyError } from "@/lib/util";

const EMPTY: AdInput = { slot: "home", title: "", body: "", imageUrl: null, linkUrl: "", active: true };

export default function AdsTab() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [form, setForm] = useState<AdInput>(EMPTY);
  const [editId, setEditId] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = useCallback(async () => {
    try {
      setAds(await fetchAllAds());
    } catch (err) {
      setError(friendlyError(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reset = () => {
    setForm(EMPTY);
    setEditId("");
  };

  const pickImage = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    const bad = validateImage(file);
    if (bad) return setError(bad);
    setUploading(true);
    setError("");
    try {
      const url = await uploadImage("ads", "ads", file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (editId) await updateAd(editId, form);
      else await createAd(form);
      setInfo(editId ? "Реклама обновлена" : "Реклама добавлена");
      reset();
      await load();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const edit = (ad: Ad) => {
    setEditId(ad.id);
    setForm({ slot: ad.slot, title: ad.title, body: ad.body ?? "", imageUrl: ad.imageUrl, linkUrl: ad.linkUrl ?? "", active: ad.active });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggle = async (ad: Ad) => {
    try {
      await setAdActive(ad.id, !ad.active);
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const remove = async (ad: Ad) => {
    if (!window.confirm(`Удалить рекламу «${ad.title}»?`)) return;
    try {
      await deleteAd(ad);
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <>
      <div className="vp-section">
        <h2>{editId ? "Изменить рекламу" : "Новая реклама"}</h2>
        <PhotoUploaderNote />
        <label className="vp-field">
          <span>Где показывать</span>
          <select className="input" value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value as AdSlotId })}>
            {AD_SLOTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="vp-field">
          <span>Заголовок *</span>
          <input className="input" maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="vp-field">
          <span>Текст</span>
          <textarea className="input" maxLength={300} style={{ minHeight: 70 }} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </label>
        <label className="vp-field">
          <span>Ссылка (https://…)</span>
          <input className="input" inputMode="url" placeholder="https://example.com" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
        </label>
        <div className="vp-field">
          <span>Картинка</span>
          {form.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imageUrl} alt="" style={{ maxWidth: 220, borderRadius: 10, marginBottom: 8 }} />
          )}
          <div className="vp-actions">
            <label className="vp-btn" style={{ cursor: uploading ? "wait" : "pointer" }}>
              {uploading ? "Загрузка…" : form.imageUrl ? "Заменить" : "Загрузить"}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={pickImage} disabled={uploading} />
            </label>
            {form.imageUrl && (
              <button type="button" className="vp-btn" onClick={() => setForm({ ...form, imageUrl: null })}>Убрать</button>
            )}
          </div>
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Показывать посетителям
        </label>
        {error && <div className="vp-error">{error}</div>}
        {info && <div style={{ color: "var(--blue)", fontSize: 13 }}>{info}</div>}
        <div className="vp-actions" style={{ marginTop: 8 }}>
          <button type="button" className="vp-btn vp-btn-primary" disabled={busy || uploading} onClick={save}>
            {busy ? "Сохранение…" : editId ? "Сохранить" : "Добавить"}
          </button>
          {editId && <button type="button" className="vp-btn" onClick={reset}>Отмена</button>}
        </div>
      </div>

      {AD_SLOTS.map((slot) => {
        const list = ads.filter((a) => a.slot === slot.id);
        return (
          <div key={slot.id} className="vp-section">
            <h2>{slot.label}</h2>
            {list.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Рекламы нет: посетители видят «Здесь будет ваша реклама».</p>
            )}
            {list.map((ad) => (
              <div key={ad.id} className="vp-row" style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong>{ad.title}</strong>
                  <div style={{ fontSize: 12, color: ad.active ? "var(--blue)" : "var(--muted)" }}>{ad.active ? "Показывается" : "Скрыта"}</div>
                </div>
                <div className="vp-actions">
                  <button type="button" className="vp-btn" onClick={() => toggle(ad)} aria-label={ad.active ? "Скрыть" : "Показать"}>
                    {ad.active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button type="button" className="vp-btn" onClick={() => edit(ad)} aria-label="Изменить"><Pencil size={14} /></button>
                  <button type="button" className="vp-btn vp-btn-danger" onClick={() => remove(ad)} aria-label="Удалить"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
