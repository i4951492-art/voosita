"use client";

import { useState, type ChangeEvent } from "react";
import { Camera, X } from "lucide-react";
import { removeImage, uploadImage, validateImage } from "@/lib/storage";
import { friendlyError } from "@/lib/util";

/** Uploads photos to a bucket under the user's own folder. */
export default function PhotoUploader({
  bucket,
  folder,
  urls,
  max,
  onChange,
}: {
  bucket: string;
  folder: string;
  urls: string[];
  max: number;
  onChange: (urls: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onPick = async (ev: ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(ev.target.files ?? []);
    ev.target.value = "";
    if (files.length === 0) return;
    setError("");
    setBusy(true);
    let next = [...urls];
    try {
      for (const file of files) {
        if (next.length >= max) break;
        const bad = validateImage(file);
        if (bad) {
          setError(bad);
          continue;
        }
        const url = await uploadImage(bucket, folder, file);
        next = [...next, url];
        onChange(next);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = (url: string) => {
    onChange(urls.filter((u) => u !== url));
    removeImage(bucket, url).catch(() => undefined);
  };

  return (
    <div>
      <div className="vp-photo-grid">
        {urls.map((url) => (
          <div key={url} className="vp-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" />
            <button type="button" onClick={() => remove(url)} aria-label="Удалить фото" className="vp-photo-x">
              <X size={14} />
            </button>
          </div>
        ))}
        {urls.length < max && (
          <label className="vp-photo vp-photo-add" style={{ cursor: busy ? "wait" : "pointer" }}>
            <Camera size={22} />
            <span>{busy ? "Загрузка…" : "Добавить"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={onPick} disabled={busy} hidden />
          </label>
        )}
      </div>
      {error && <div className="vp-error">{error}</div>}
    </div>
  );
}
