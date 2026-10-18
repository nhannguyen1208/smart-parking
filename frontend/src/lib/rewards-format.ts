/** Format "07:10" → "7:10 AM" for student-facing copy. */
export function formatWindowHm(hm: string) {
  const [hRaw, mRaw] = hm.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return hm;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Prefer given name: last token for VN-style names (3+ parts), else first. */
export function firstName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fullName;
  if (parts.length >= 3) return parts[parts.length - 1]!;
  return parts[0]!;
}

export function timeOfDayGreeting(name: string, now = new Date()) {
  const hour = now.getHours();
  const who = firstName(name);
  if (hour < 12) return `Good morning, ${who}!`;
  if (hour < 18) return `Good afternoon, ${who}!`;
  return `Good evening, ${who}!`;
}

export function formatActivityDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export const MISSION_STATUS_LABEL: Record<string, string> = {
  UPCOMING: "Upcoming",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  MISSED: "Missed",
  INACTIVE: "Inactive",
};
