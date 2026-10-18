import { getAppBasePath } from "./zalo";

export function appPath(path = "/") {
  const base = getAppBasePath();
  if (!path || path === "/") return base || "/";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function parseRoute() {
  const base = getAppBasePath();
  let path = window.location.pathname || "/";
  if (base && path.startsWith(base)) {
    path = path.slice(base.length) || "/";
  }
  const trackMatch = path.match(/^\/track\/([^/]+)/);
  if (trackMatch) return { name: "track", token: trackMatch[1] };
  return { name: "app" };
}
