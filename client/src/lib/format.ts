export function formatNumber(n: number, locale: string): string {
  const lang = locale.startsWith("he") ? "he-IL" : "en-US";
  return new Intl.NumberFormat(lang).format(n);
}

export function formatWeight(kg: number, units: "kg" | "lb", locale: string): string {
  if (units === "lb") {
    const lb = Math.round(kg * 2.20462 * 10) / 10;
    return `${formatNumber(lb, locale)} lb`;
  }
  return `${formatNumber(kg, locale)} ${locale.startsWith("he") ? "ק\"ג" : "kg"}`;
}

export function formatDate(d: string | Date, locale: string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const lang = locale.startsWith("he") ? "he-IL" : "en-US";
  return new Intl.DateTimeFormat(lang, { year: "numeric", month: "short", day: "numeric" }).format(date);
}

export function formatDayName(dayOfWeek: number, locale: string): string {
  const lang = locale.startsWith("he") ? "he-IL" : "en-US";
  const date = new Date(2024, 5, 2 + dayOfWeek);
  return new Intl.DateTimeFormat(lang, { weekday: "long" }).format(date);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function greetingKey(date: Date = new Date()): "greeting_morning" | "greeting_afternoon" | "greeting_evening" {
  const h = date.getHours();
  if (h < 12) return "greeting_morning";
  if (h < 18) return "greeting_afternoon";
  return "greeting_evening";
}
