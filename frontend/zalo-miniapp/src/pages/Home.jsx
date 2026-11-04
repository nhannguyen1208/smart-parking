import { useEffect, useState } from "react";
import AccentBar from "../components/AccentBar";
import FeatureSheet from "../components/FeatureSheet";
import GuestPass from "../components/GuestPass";
import KillSwitch from "../components/KillSwitch";
import NightOwl from "../components/NightOwl";
import ParkingRadar from "../components/ParkingRadar";
import ParkWiseChatbot from "../components/ParkWiseChatbot";
import Toast from "../components/Toast";
import VNUKWordmark from "../components/VNUKWordmark";
import { api } from "../lib/api";
import { clearSession, getStoredUser, getToken, setSession } from "../lib/auth";
import { disconnectSocket } from "../lib/socket";
import { applyAppTheme, resetAppTheme, resolveThemeId } from "../lib/themes";

const FEATURES = [
  {
    id: "radar",
    label: "Live Radar",
    hint: "3 bãi ĐH Đà Nẵng",
    tone: "bg-[#e8f5ee] text-[#15803d]",
    icon: "radar",
  },
  {
    id: "guest",
    label: "Backup Pass",
    hint: "QR khi quên thẻ",
    tone: "bg-brand-light text-brand-blue",
    icon: "qr",
  },
  {
    id: "night",
    label: "Night-Owl",
    hint: "Theo dõi về nhà",
    tone: "bg-[#efe6ea] text-brand-red",
    icon: "moon",
  },
  {
    id: "assist",
    label: "Hỗ trợ",
    hint: "Hỏi nhanh",
    tone: "bg-surface text-navy",
    icon: "chat",
  },
];

export default function Home({ onLogout, onOpenTrack }) {
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState("");
  const [toast, setToast] = useState("");
  const [sheet, setSheet] = useState(null);
  const user = getStoredUser();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await api.me();
        if (!alive) return;
        setIsLocked(Boolean(data.locked));
        if (data.user) {
          setSession({ token: getToken(), user: data.user });
        }
        applyAppTheme(
          resolveThemeId(
            data.user?.preferences?.qrTheme,
            Boolean(data.activeMembership),
          ),
        );
      } catch (err) {
        if (!alive) return;
        setBootError(err.message || "Không tải được phiên");
        resetAppTheme();
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  function handleLogout() {
    disconnectSocket();
    resetAppTheme();
    clearSession();
    onLogout?.();
  }

  const displayName = user?.displayName || user?.name || "Sinh viên";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (loading) {
    return (
      <Shell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand-blue" />
            <p className="mt-3 text-sm text-muted">Đang mở ParkWise…</p>
          </div>
        </div>
      </Shell>
    );
  }

  if (bootError) {
    return (
      <Shell>
        <div className="mx-auto mt-16 max-w-sm rounded-[22px] border border-border bg-card px-5 py-8 text-center shadow-[var(--shadow-card)]">
          <p className="text-lg font-semibold text-navy">Không tải được phiên</p>
          <p className="mt-2 text-sm text-muted">{bootError}</p>
          <p className="mt-2 text-xs text-muted">
            Cùng tài khoản web · MSSV {user?.studentId || "—"}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 h-11 rounded-[14px] bg-brand-red px-5 text-sm font-semibold text-white"
          >
            Về đăng nhập
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Toast message={toast} onDismiss={() => setToast("")} />

      <header className="animate-fade-up mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-navy text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,93,170,0.28)]">
          {initials || "PW"}
        </div>
        <div className="min-w-0 flex-1">
          <VNUKWordmark size="sm" />
          <p className="mt-0.5 truncate text-[13px] font-medium text-navy">
            {displayName}
            {user?.studentId ? (
              <span className="font-normal text-muted"> · {user.studentId}</span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-brand-red shadow-[var(--shadow-card)] ring-1 ring-border"
        >
          Thoát
        </button>
      </header>

      <section className="animate-fade-up-delay-1 mb-4 overflow-hidden rounded-[26px] bg-card shadow-[0_18px_50px_rgba(11,46,89,0.12)] ring-1 ring-white/70">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0b2e59] via-[#0a4a86] to-[#005daa] px-5 pb-6 pt-5 text-white">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 left-6 h-32 w-32 rounded-full bg-[#891635]/30 blur-2xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                Khoá thẻ RFID
              </p>
              <p className="mt-1.5 text-[22px] font-semibold tracking-tight">
                {user?.studentId || "ParkWise"}
              </p>
              <p className="mt-1 text-[12px] text-white/70">
                Thẻ gắn MSSV · cùng tài khoản web
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
                isLocked
                  ? "bg-[#891635]/80 text-white ring-white/20"
                  : "bg-white/15 text-white ring-white/25"
              }`}
            >
              {isLocked ? "Đã khoá" : "Sẵn sàng"}
            </span>
          </div>

          <div className="relative mt-6 flex flex-col items-center">
            <KillSwitch
              compact
              isLocked={isLocked}
              onChanged={(locked) => {
                setIsLocked(locked);
                setToast(
                  locked
                    ? "Khoá thẻ ON — RFID bị từ chối tại cổng"
                    : "Khoá thẻ OFF — sẵn sàng quét cổng",
                );
              }}
            />
            <p className="mt-3 max-w-[240px] text-center text-[12px] leading-relaxed text-white/75">
              {isLocked
                ? "Thẻ bị bỏ qua tại cổng."
                : "Chạm để khoá thẻ khi không dùng."}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-5 pb-24">
        <p className="mb-2.5 px-0.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
          Tiện ích
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {FEATURES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSheet(f.id)}
              className="rounded-[18px] border border-border/80 bg-white p-3.5 text-left shadow-[var(--shadow-card)] transition active:scale-[0.98]"
            >
              <span
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${f.tone}`}
              >
                <FeatureIcon name={f.icon} />
              </span>
              <p className="text-[14px] font-semibold text-navy">{f.label}</p>
              <p className="mt-0.5 text-[11px] text-muted">{f.hint}</p>
            </button>
          ))}
        </div>
      </section>

      <FeatureSheet
        open={sheet === "radar"}
        title="Live Parking Radar"
        subtitle="Đại học Đà Nẵng · 3 bãi"
        onClose={() => setSheet(null)}
      >
        <ParkingRadar />
      </FeatureSheet>

      <FeatureSheet
        open={sheet === "guest"}
        title="Quét để vào"
        subtitle="Backup Pass"
        onClose={() => setSheet(null)}
      >
        <GuestPass />
      </FeatureSheet>

      <FeatureSheet
        open={sheet === "night"}
        title="Night-Owl"
        subtitle="Theo dõi về nhà"
        onClose={() => setSheet(null)}
      >
        <NightOwl
          onOpenTrack={(token) => {
            setSheet(null);
            onOpenTrack?.(token);
          }}
        />
      </FeatureSheet>

      <FeatureSheet
        open={sheet === "assist"}
        title="Hỗ trợ ParkWise"
        subtitle="Câu hỏi thường gặp"
        onClose={() => setSheet(null)}
      >
        <ParkWiseChatbot
          variant="embedded"
          onAction={(action) => setSheet(action)}
        />
      </FeatureSheet>

      {sheet !== "assist" ? (
        <ParkWiseChatbot
          variant="floating"
          onAction={(action) => setSheet(action)}
        />
      ) : null}
    </Shell>
  );
}

function FeatureIcon({ name }) {
  if (name === "radar") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="2.2" fill="currentColor" />
        <path
          d="M7.2 7.2a6.8 6.8 0 0 1 9.6 9.6M5 5a9.8 9.8 0 0 1 14 14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (name === "qr") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 3h3v3h-3v-3Zm3-3h3v3h-3v-3Z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "moon") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M16 3a8 8 0 1 0 5 14A9 9 0 0 1 16 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 16.5V7.8A2.8 2.8 0 0 1 7.8 5h8.4A2.8 2.8 0 0 1 19 7.8v5.4a2.8 2.8 0 0 1-2.8 2.8H9l-4 3v-2.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Shell({ children }) {
  return (
    <div className="page-atmosphere min-h-screen">
      <AccentBar />
      <div className="mx-auto min-h-[calc(100vh-5px)] max-w-md px-4 pb-6 pt-[max(0.85rem,env(safe-area-inset-top))]">
        {children}
      </div>
    </div>
  );
}
