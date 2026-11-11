import { supabase } from "./supabase";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Returns an error text, or null when the file is acceptable. */
export function validateImage(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "Допустимые форматы: JPG, PNG, WEBP, GIF";
  if (file.size > MAX_IMAGE_BYTES) return "Фото больше 5 МБ";
  return null;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Uploads to `bucket/folder/<time>-<rand>.<ext>` and returns the public URL. */
export async function uploadImage(bucket: string, folder: string, file: File): Promise<string> {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const bad = validateImage(file);
  if (bad) throw new Error(bad);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT[file.type]}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function removeImage(bucket: string, url: string): Promise<void> {
  if (!supabase) return;
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
  await supabase.storage.from(bucket).remove([path]);
}
