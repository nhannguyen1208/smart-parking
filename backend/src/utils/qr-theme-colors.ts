/** Keep in sync with frontend `qr-themes.ts` / miniapp `themes.js`. */

export const DEFAULT_QR_THEME_ID = "vnuk";

const QR_THEME_COLORS: Record<string, { dark: string; light: string }> = {
  vnuk: { dark: "#0b2e59", light: "#ffffff" },
  crimson: { dark: "#891635", light: "#fff0f4" },
  ocean: { dark: "#0369a1", light: "#e0f2fe" },
  midnight: { dark: "#fef08a", light: "#1e1b4b" },
  mint: { dark: "#047857", light: "#d1fae5" },
  sunset: { dark: "#c2410c", light: "#ffedd5" },
};

export function qrColorsForTheme(id: string | null | undefined) {
  if (id && QR_THEME_COLORS[id]) return QR_THEME_COLORS[id];
  return QR_THEME_COLORS[DEFAULT_QR_THEME_ID];
}
