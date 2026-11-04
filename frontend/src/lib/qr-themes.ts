export type QrThemeId =
  | "vnuk"
  | "crimson"
  | "ocean"
  | "midnight"
  | "mint"
  | "sunset";

export type AppCssVars = {
  background: string;
  foreground: string;
  card: string;
  border: string;
  muted: string;
  navy: string;
  "navy-dark": string;
  "brand-blue": string;
  "brand-red": string;
  "brand-light": string;
  surface: string;
};

export type QrTheme = {
  id: QrThemeId;
  label: string;
  description: string;
  qr: { dark: string; light: string };
  /** Soft decorative blob color (CSS) */
  blob: string;
  /** Classes for the outer pass card */
  cardClass: string;
  /** Classes wrapping the QR square */
  frameClass: string;
  /** Accent text (countdown / labels) when not warning */
  accentClass: string;
  /** Token / mono text color */
  tokenClass: string;
  mutedClass: string;
  /** CSS custom properties applied to the whole web app */
  app: AppCssVars;
};

export const DEFAULT_QR_THEME_ID: QrThemeId = "vnuk";

export const QR_THEMES: QrTheme[] = [
  {
    id: "vnuk",
    label: "Campus Pop",
    description: "Cổng xanh vui vẻ",
    qr: { dark: "#0b2e59", light: "#ffffff" },
    blob: "rgba(0, 93, 170, 0.18)",
    cardClass:
      "relative overflow-hidden border-2 border-[#0b2e59]/20 bg-gradient-to-br from-white via-[#f5f8ff] to-[#dbe5ff]",
    frameClass:
      "bg-white ring-4 ring-[#005daa]/15 shadow-[6px_6px_0_#0b2e59]",
    accentClass: "text-brand-blue",
    tokenClass: "text-navy",
    mutedClass: "text-muted",
    app: {
      background: "#f3f5fa",
      foreground: "#0b2e59",
      card: "#ffffff",
      border: "#e2e7f0",
      muted: "#627d98",
      navy: "#0b2e59",
      "navy-dark": "#1e3060",
      "brand-blue": "#005daa",
      "brand-red": "#891635",
      "brand-light": "#dbe5ff",
      surface: "#eef2f8",
    },
  },
  {
    id: "crimson",
    label: "Cherry Bounce",
    description: "Đỏ VNUK cartoon",
    qr: { dark: "#891635", light: "#fff0f4" },
    blob: "rgba(137, 22, 53, 0.16)",
    cardClass:
      "relative overflow-hidden border-2 border-[#891635]/25 bg-gradient-to-br from-[#fff7f9] via-[#ffe4ec] to-[#ffc2d4]",
    frameClass:
      "bg-[#fff0f4] ring-4 ring-[#891635]/15 shadow-[6px_6px_0_#891635] rotate-[-1deg]",
    accentClass: "text-brand-red",
    tokenClass: "text-[#6f122b]",
    mutedClass: "text-[#9f4a62]",
    app: {
      background: "#fff5f7",
      foreground: "#5c1028",
      card: "#ffffff",
      border: "#f3c5d0",
      muted: "#9f4a62",
      navy: "#5c1028",
      "navy-dark": "#3f0a1b",
      "brand-blue": "#b91c4a",
      "brand-red": "#891635",
      "brand-light": "#ffe4ec",
      surface: "#fff0f4",
    },
  },
  {
    id: "ocean",
    label: "Bubble Blue",
    description: "Sóng & bong bóng",
    qr: { dark: "#0369a1", light: "#e0f2fe" },
    blob: "rgba(14, 165, 233, 0.2)",
    cardClass:
      "relative overflow-hidden border-2 border-[#0ea5e9]/30 bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd]",
    frameClass:
      "bg-[#e0f2fe] ring-4 ring-[#0ea5e9]/20 shadow-[6px_6px_0_#0369a1] rotate-[1deg]",
    accentClass: "text-[#0369a1]",
    tokenClass: "text-[#0c4a6e]",
    mutedClass: "text-[#0284c7]",
    app: {
      background: "#f0f9ff",
      foreground: "#0c4a6e",
      card: "#ffffff",
      border: "#bae6fd",
      muted: "#0284c7",
      navy: "#0c4a6e",
      "navy-dark": "#082f49",
      "brand-blue": "#0284c7",
      "brand-red": "#e11d48",
      "brand-light": "#e0f2fe",
      surface: "#e0f2fe",
    },
  },
  {
    id: "midnight",
    label: "Night Owl",
    description: "Đêm neon dễ thương",
    qr: { dark: "#fef08a", light: "#1e1b4b" },
    blob: "rgba(254, 240, 138, 0.22)",
    cardClass:
      "relative overflow-hidden border-2 border-[#818cf8]/40 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] text-white",
    frameClass:
      "bg-[#1e1b4b] ring-4 ring-[#fef08a]/25 shadow-[6px_6px_0_#fef08a]",
    accentClass: "text-[#fef08a]",
    tokenClass: "text-white",
    mutedClass: "text-white/55",
    app: {
      background: "#12102a",
      foreground: "#eef2ff",
      card: "#1e1b4b",
      border: "#4338ca",
      muted: "#a5b4fc",
      navy: "#eef2ff",
      "navy-dark": "#c7d2fe",
      "brand-blue": "#818cf8",
      "brand-red": "#fb7185",
      "brand-light": "#312e81",
      surface: "#312e81",
    },
  },
  {
    id: "mint",
    label: "Matcha Hop",
    description: "Xanh bạc hà nhảy",
    qr: { dark: "#047857", light: "#d1fae5" },
    blob: "rgba(16, 185, 129, 0.2)",
    cardClass:
      "relative overflow-hidden border-2 border-[#34d399]/35 bg-gradient-to-br from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0]",
    frameClass:
      "bg-[#d1fae5] ring-4 ring-[#10b981]/20 shadow-[6px_6px_0_#047857] rotate-[-1.5deg]",
    accentClass: "text-[#047857]",
    tokenClass: "text-[#065f46]",
    mutedClass: "text-[#059669]",
    app: {
      background: "#ecfdf5",
      foreground: "#064e3b",
      card: "#ffffff",
      border: "#a7f3d0",
      muted: "#059669",
      navy: "#064e3b",
      "navy-dark": "#022c22",
      "brand-blue": "#0d9488",
      "brand-red": "#e11d48",
      "brand-light": "#d1fae5",
      surface: "#d1fae5",
    },
  },
  {
    id: "sunset",
    label: "Candy Sunset",
    description: "Cam ấm cartoon",
    qr: { dark: "#c2410c", light: "#ffedd5" },
    blob: "rgba(251, 146, 60, 0.22)",
    cardClass:
      "relative overflow-hidden border-2 border-[#fb923c]/40 bg-gradient-to-br from-[#fff7ed] via-[#ffedd5] to-[#fed7aa]",
    frameClass:
      "bg-[#ffedd5] ring-4 ring-[#fb923c]/25 shadow-[6px_6px_0_#c2410c] rotate-[1.5deg]",
    accentClass: "text-[#c2410c]",
    tokenClass: "text-[#9a3412]",
    mutedClass: "text-[#ea580c]",
    app: {
      background: "#fff7ed",
      foreground: "#7c2d12",
      card: "#ffffff",
      border: "#fed7aa",
      muted: "#ea580c",
      navy: "#7c2d12",
      "navy-dark": "#431407",
      "brand-blue": "#ea580c",
      "brand-red": "#c2410c",
      "brand-light": "#ffedd5",
      surface: "#ffedd5",
    },
  },
];

const STORAGE_KEY = "parkwise.qrTheme";

export function getQrTheme(id: string | null | undefined): QrTheme {
  return QR_THEMES.find((t) => t.id === id) ?? QR_THEMES[0];
}

export function isQrThemeId(value: unknown): value is QrThemeId {
  return (
    typeof value === "string" && QR_THEMES.some((theme) => theme.id === value)
  );
}

export function readStoredQrThemeId(): QrThemeId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isQrThemeId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredQrThemeId(id: QrThemeId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore quota / private mode
  }
}

export function applyAppTheme(id: QrThemeId | string | null | undefined) {
  if (typeof document === "undefined") return;
  const theme = getQrTheme(id);
  const root = document.documentElement;
  root.dataset.appTheme = theme.id;
  for (const [key, value] of Object.entries(theme.app)) {
    root.style.setProperty(`--${key}`, value);
  }
}

export async function renderQrDataUrl(
  payload: string,
  theme: QrTheme,
  width = 280,
) {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(payload, {
    margin: 1,
    width,
    color: { dark: theme.qr.dark, light: theme.qr.light },
  });
}
