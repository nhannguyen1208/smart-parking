/**
 * Thin wrapper around zmp-sdk.
 * In browser demo (outside Zalo), APIs fail → caller falls back to demo login.
 */
import {
  authorize,
  getAccessToken,
  getPhoneNumber,
  getUserInfo,
  openShareSheet,
} from "zmp-sdk/apis";

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

/**
 * Share Night-Owl track with family via Zalo sheet.
 * Prefer Mini App deep link so recipient opens /track/:token inside ParkWise.
 */
export async function shareTrackToZalo({
  path,
  title,
  description,
  link,
  thumbnail,
}) {
  const thumb =
    thumbnail ||
    "https://stc-zmp.zadn.vn/zmp-docs/static/img/logo.b8f0e0a1.png";

  // Prefer sharing the public web track URL (works for anyone in a browser)
  if (link) {
    try {
      await openShareSheet({
        type: "link",
        data: { link, chatOnly: false },
      });
      return { ok: true, via: "link" };
    } catch {
      // fall through
    }

    try {
      await openShareSheet({
        type: "text",
        data: {
          text: `${title || "Night-Owl"}\n${description || ""}\n${link}`,
          autoParseLink: true,
        },
      });
      return { ok: true, via: "text" };
    } catch {
      // fall through
    }

    try {
      const text = encodeURIComponent(description || title || "Night-Owl");
      window.open(
        `https://zalo.me/share?u=${encodeURIComponent(link)}&t=${text}`,
        "_blank",
        "noopener,noreferrer",
      );
      return { ok: true, via: "zalo.me" };
    } catch {
      // ignore
    }
  }

  // Fallback: Mini App deep link (recipient needs Zalo + Mini App)
  if (path) {
    try {
      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: title || "ParkWise Night-Owl",
          description:
            description || "Theo dõi vị trí trên bản đồ khi về nhà",
          thumbnail: thumb,
          path,
        },
      });
      return { ok: true, via: "zmp_deep_link" };
    } catch {
      // ignore
    }
  }

  return { ok: false };
}
