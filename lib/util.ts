/** Small helpers shared by pages. */

export function errText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

/** Remove characters that break PostgREST filter syntax or act as SQL wildcards. */
export function sanitizeQuery(q: string): string {
  return q.replace(/[,()%*_\\"'`;:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

/** Only http(s) links are allowed for outside URLs (ads). */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function getQueryParam(name: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Turns database and network errors into messages a person can read. */
export function friendlyError(err: unknown): string {
  const m = errText(err);
  if (m.includes("LISTING_LIMIT")) return "Достигнут лимит: не больше 30 объявлений";
  if (m.includes("REPORT_LIMIT")) return "Слишком много жалоб за сутки";
  if (m.includes("row-level security") || m.includes("permission denied"))
    return "Действие недоступно. Войдите в аккаунт или обратитесь в поддержку";
  if (m.includes("duplicate key")) return "Это уже сделано";
  if (m.includes("Failed to fetch") || m.includes("NetworkError") || m.includes("Load failed"))
    return "Нет связи с сервером. Проверьте интернет";
  if (m === "NOT_LOGGED_IN") return "Войдите в аккаунт";
  if (m === "NOT_CONFIGURED") return "База данных не подключена";
  return m;
}
