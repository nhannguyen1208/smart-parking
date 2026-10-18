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
  const [demoPhone, setDemoPhone] = useState("0901234567");
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
    <div className="page-atmosphere min-h-screen overflow-hidden">
      <AccentBar />
      <div className="relative mx-auto flex min-h-[calc(100vh-5px)] w-full max-w-md flex-col gap-5 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-brand-blue/15 blur-3xl brand-glow" />
        <div className="pointer-events-none absolute -right-10 bottom-24 h-64 w-64 rounded-full bg-brand-red/10 blur-3xl" />

        <section className="animate-fade-up relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#005daa] via-[#0b4f8a] to-[#0b2e59] p-6 text-brand-light shadow-[0_24px_60px_rgba(11,46,89,0.28)]">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute left-6 top-20 h-28 w-28 rounded-full border border-white/20" />
            <div className="absolute right-8 top-10 h-16 w-16 rounded-full border border-white/15" />
          </div>
          <div className="relative">
            <VNUKWordmark size="lg" onDark />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              VNUK ParkWise · The Silent Gate
            </p>
            <h1 className="mt-5 text-[28px] font-semibold leading-tight tracking-tight text-white">
              Campus parking on Zalo
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Đăng nhập bằng số điện thoại Zalo để mở cổng, Backup Pass và Kill-Switch.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: "Access", value: "RFID + QR" },
                { label: "ID", value: hasRealAppId ? "Live" : "Demo" },
                { label: "Campus", value: "VNUK" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[14px] border border-white/15 bg-white/10 px-2.5 py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-wide text-white/65">
                    {item.label}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="animate-fade-up-delay-1 relative z-10 rounded-[24px] border border-border/80 bg-white p-6 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
            Welcome back
          </p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-tight text-navy">
            Sign in
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Same ParkWise look as the web app — identify with your Zalo phone number.
          </p>

          {error ? (
            <p className="mt-4 rounded-[12px] border border-red-200 bg-[#fef2f2] px-3 py-2.5 text-xs text-[#b91c1c]">
              {error}
            </p>
          ) : null}

          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Demo phone (browser preview)
            </span>
            <div className="rounded-[14px] border border-border bg-white p-3.5 focus-within:border-brand-blue/40 focus-within:ring-4 focus-within:ring-[rgba(0,93,170,0.12)]">
              <input
                value={demoPhone}
                onChange={(e) => setDemoPhone(e.target.value)}
                inputMode="tel"
                placeholder="0901234567"
                className="w-full bg-transparent text-sm text-navy outline-none placeholder:text-muted/70"
              />
            </div>
          </label>

          <Button
            type="button"
            disabled={loading}
            onClick={handleZaloPhoneLogin}
            className="mt-4 w-full"
          >
            {loading ? "Đang xác thực SĐT…" : "Đăng nhập bằng SĐT Zalo"}
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted">
            Trong Zalo: cho phép chia sẻ số điện thoại
          </p>
        </section>
      </div>
    </div>
  );
}
