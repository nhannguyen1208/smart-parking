/**
 * Thin wrapper around zmp-sdk.
 * In browser demo (outside Zalo), APIs fail → caller falls back to demo login.
 */
import { authorize, getAccessToken, getPhoneNumber, getUserInfo } from "zmp-sdk/apis";

export function getMiniAppId() {
  return (
    import.meta.env.VITE_ZALO_MINI_APP_ID ||
    (typeof __ZALO_MINI_APP_ID__ !== "undefined" ? __ZALO_MINI_APP_ID__ : "") ||
    ""
  );
}

export function getAppBasePath() {
  const id = getMiniAppId();
  if (id && id !== "YOUR_ZALO_MINI_APP_ID" && window.location.pathname.includes("/zapps/")) {
    return `/zapps/${id}`;
  }
  return "";
}

export async function tryGetZaloAccessToken() {
  try {
    const { token } = await getAccessToken({});
    return token || null;
  } catch {
    return null;
  }
}

export async function tryGetZaloUser() {
  try {
    const { userInfo } = await getUserInfo({ autoRequestPermission: true });
    return userInfo || null;
  } catch {
    return null;
  }
}

/** Request phone scope + one-time phone token (must be exchanged on server). */
export async function tryGetZaloPhoneToken() {
  try {
    await authorize({
      scopes: ["scope.userInfo", "scope.userPhonenumber"],
    });
  } catch {
    // User may already have granted / denied — still try getPhoneNumber
  }

  try {
    const { token } = await getPhoneNumber({});
    return token || null;
  } catch {
    return null;
  }
}
