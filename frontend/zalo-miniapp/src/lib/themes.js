/** Mirrors web `qr-themes.ts` app tokens — keep in sync when adding themes. */

export const DEFAULT_THEME_ID = "vnuk";

export const THEMES = {
  vnuk: {
    id: "vnuk",
    label: "Campus Pop",
    qr: { dark: "#0b2e59", light: "#ffffff" },
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
  crimson: {
    id: "crimson",
    label: "Cherry Bounce",
    qr: { dark: "#891635", light: "#fff0f4" },
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
  ocean: {
    id: "ocean",
    label: "Bubble Blue",
    qr: { dark: "#0369a1", light: "#e0f2fe" },
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
  midnight: {
    id: "midnight",
    label: "Night Owl",
    qr: { dark: "#fef08a", light: "#1e1b4b" },
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
  mint: {
    id: "mint",
    label: "Matcha Hop",
    qr: { dark: "#047857", light: "#d1fae5" },
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
  sunset: {
    id: "sunset",
    label: "Candy Sunset",
    qr: { dark: "#c2410c", light: "#ffedd5" },
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
};

export function getTheme(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME_ID];
}

/** Membership required for custom themes — same rule as web. */
export function resolveThemeId(qrTheme, hasMembership) {
  if (!hasMembership) return DEFAULT_THEME_ID;
  return THEMES[qrTheme] ? qrTheme : DEFAULT_THEME_ID;
}

export function applyAppTheme(id) {
  if (typeof document === "undefined") return;
  const theme = getTheme(id);
  const root = document.documentElement;
  root.dataset.appTheme = theme.id;
  for (const [key, value] of Object.entries(theme.app)) {
    root.style.setProperty(`--${key}`, value);
  }
  // Mini App aliases used in older class names
  root.style.setProperty("--ink", theme.app.navy);
  root.style.setProperty("--wash", theme.app.surface);
  root.style.setProperty("--line", theme.app.border);
}

export function resetAppTheme() {
  applyAppTheme(DEFAULT_THEME_ID);
}
