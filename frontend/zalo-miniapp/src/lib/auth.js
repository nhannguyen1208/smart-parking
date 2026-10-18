/**
 * Zalo Mini App does not support localStorage / sessionStorage / cookies.
 * Keep session in memory; optionally mirror to sessionStorage in browser demo.
 */
const TOKEN_KEY = "parkwise_token";
const USER_KEY = "parkwise_user";

const memory = {
  token: null,
  user: null,
};

function canUseWebStorage() {
  try {
    if (typeof sessionStorage === "undefined") return false;
    const probe = "__pw_probe__";
    sessionStorage.setItem(probe, "1");
    sessionStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const webStorage = canUseWebStorage();

export function getToken() {
  if (memory.token) return memory.token;
  if (!webStorage) return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  if (memory.user) return memory.user;
  if (!webStorage) return null;
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession({ token, user }) {
  memory.token = token ?? null;
  memory.user = user ?? null;
  if (!webStorage) return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  memory.token = null;
  memory.user = null;
  if (!webStorage) return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}
