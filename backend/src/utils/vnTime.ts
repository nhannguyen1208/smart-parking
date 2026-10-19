/** Campus timezone helpers (Asia/Ho_Chi_Minh). */

export const CAMPUS_TZ = "Asia/Ho_Chi_Minh";

function partsInTz(date: Date, timeZone = CAMPUS_TZ) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const map = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return map;
}

/** YYYY-MM-DD in campus TZ */
export function vnDayKey(date: Date) {
  const p = partsInTz(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Minutes from midnight in campus TZ */
export function vnMinutesOfDay(date: Date) {
  const p = partsInTz(date);
  const hour = Number(p.hour === "24" ? "0" : p.hour);
  return hour * 60 + Number(p.minute);
}

/** JS weekday 0=Sun … 6=Sat in campus TZ */
export function vnWeekday(date: Date) {
  const p = partsInTz(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[p.weekday] ?? new Date(date).getUTCDay();
}

/** Parse "HH:mm" → minutes from midnight */
export function parseHm(hm: string) {
  const [h, m] = hm.split(":").map((x) => Number(x));
  return (h || 0) * 60 + (m || 0);
}

export function formatHm(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Build a Date whose campus-local clock matches today's date + HH:mm
 * (approximate: uses iterative offset — good enough for DEMO simulate).
 */
export function vnDateTodayAt(hm: string, base = new Date()) {
  const targetMin = parseHm(hm);
  const day = vnDayKey(base);
  // Start from UTC noon of an estimate then adjust
  let guess = new Date(`${day}T${hm}:00+07:00`);
  if (Number.isNaN(guess.getTime())) {
    guess = new Date(base);
  }
  // Nudge until dayKey + minutes match
  for (let i = 0; i < 4; i++) {
    const delta = targetMin - vnMinutesOfDay(guess);
    if (vnDayKey(guess) === day && Math.abs(delta) < 1) break;
    guess = new Date(guess.getTime() + delta * 60_000);
  }
  return guess;
}
