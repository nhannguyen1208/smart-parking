import { useState } from "react";
import AccentBar from "../components/AccentBar";
import VNUKWordmark from "../components/VNUKWordmark";
import { Button } from "../components/zmp/Button";
import { api } from "../lib/api";
import { setSession } from "../lib/auth";
import {
  getMiniAppId,
  tryGetZaloAccessToken,
  tryGetZaloPhoneToken,
  tryGetZaloUser,
} from "../lib/zalo";

export default function Login({ onLoggedIn }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoPhone, setDemoPhone] = useState("0898466842");
  const miniAppId = getMiniAppId();
  const hasRealAppId = Boolean(miniAppId && miniAppId !== "YOUR_ZALO_MINI_APP_ID");

  async function finish(data) {
    setSession({ token: data.token, user: data.user });
    onLoggedIn?.(data);
  }

  async function handleZaloPhoneLogin() {
    setLoading(true);
    setError("");
    try {
      const accessToken = await tryGetZaloAccessToken();
      if (accessToken) {
        const [zaloUser, phoneToken] = await Promise.all([
          tryGetZaloUser(),
          tryGetZaloPhoneToken(),
        ]);

        if (!phoneToken) {
          throw new Error(
            "Không lấy được SĐT Zalo — hãy cho phép quyền số điện thoại rồi thử lại.",
          );
        }

        const data = await api.phoneLogin({
          accessToken,
          phoneToken,
          zaloUserId: zaloUser?.id,
          displayName: zaloUser?.name,
        });
        await finish({
          ...data,
          user: {
            ...data.user,
            displayName: zaloUser?.name || data.user?.displayName,
            avatar: zaloUser?.avatar,
          },
        });
        return;
      }

      const data = await api.phoneLogin({ phone: demoPhone });
      await finish(data);
    } catch (err) {
      setError(
        err.message ||
          "Đăng nhập bằng SĐT thất bại — kiểm tra API / quyền Zalo / App Secret.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-atmosphere min-h-screen">
      <AccentBar />
      <div className="mx-auto flex min-h-[calc(100vh-5px)] w-full max-w-md flex-col justify-center px-4 py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <section className="animate-fade-up overflow-hidden rounded-[28px] bg-card shadow-[0_18px_50px_rgba(11,46,89,0.12)] ring-1 ring-white/80">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0b2e59] via-[#0a4a86] to-[#005daa] px-6 pb-6 pt-7 text-white">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <VNUKWordmark size="lg" onDark />
            <h1 className="relative mt-5 text-[28px] font-semibold tracking-tight">
              ParkWise
            </h1>
            <p className="relative mt-1.5 text-[14px] leading-relaxed text-white/75">
              Cùng tài khoản web VNUK. Đăng nhập bằng số điện thoại Zalo.
            </p>
          </div>

          <div className="px-6 py-6">
            <p className="mb-4 text-[12px] font-medium text-muted">
              {hasRealAppId ? "Mini App · live" : "Trình duyệt · demo SĐT"}
            </p>
            {error ? (
              <p className="mb-4 rounded-[12px] border border-brand-red/25 bg-[#fdf2f4] px-3 py-2.5 text-[12px] text-brand-red">
                {error}
              </p>
            ) : null}

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted">
                SĐT demo (khi mở ngoài Zalo)
              </span>
              <input
                value={demoPhone}
                onChange={(e) => setDemoPhone(e.target.value)}
                inputMode="tel"
                placeholder="0898466842"
                className="field-input font-mono"
              />
            </label>

            <Button
              type="button"
              disabled={loading}
              onClick={handleZaloPhoneLogin}
              className="mt-4 w-full rounded-[14px]"
            >
              {loading ? "Đang xác thực…" : "Đăng nhập bằng SĐT Zalo"}
            </Button>
            <p className="mt-3 text-center text-[12px] leading-relaxed text-muted">
              Trong Zalo: cho phép chia sẻ số điện thoại khi được hỏi.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
