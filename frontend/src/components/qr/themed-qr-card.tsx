"use client";

import type { QrTheme } from "@/lib/qr-themes";

type ThemedQrCardProps = {
  theme: QrTheme;
  qrDataUrl: string;
  token: string;
  secondsLeft: number;
  refreshSeconds: number;
};

export function ThemedQrCard({
  theme,
  qrDataUrl,
  token,
  secondsLeft,
  refreshSeconds,
}: ThemedQrCardProps) {
  return (
    <div className={`space-y-3 rounded-[22px] p-5 ${theme.cardClass}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <span
          className="theme-sticker-float absolute -right-6 -top-8 h-28 w-28 rounded-full"
          style={{ background: theme.blob }}
        />
        <span
          className="theme-sticker-float absolute -bottom-10 -left-4 h-24 w-24 rounded-full"
          style={{ background: theme.blob, animationDelay: "0.4s" }}
        />
        <span
          className="theme-sticker-float absolute right-10 top-1/2 h-3 w-3 rounded-full"
          style={{ background: theme.qr.dark, opacity: 0.35, animationDelay: "0.8s" }}
        />
      </div>

      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p
            className={`text-[11px] font-bold uppercase tracking-[0.14em] ${theme.mutedClass}`}
          >
            {theme.label}
          </p>
          <p className={`mt-0.5 text-xs ${theme.mutedClass}`}>Scan at gate</p>
        </div>
        <p
          className={`font-mono text-sm font-bold tabular-nums ${
            secondsLeft <= 3 ? "text-brand-red theme-qr-pop" : theme.accentClass
          }`}
        >
          {secondsLeft}s
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-[280px]">
        <div
          className={`theme-qr-bounce mx-auto flex aspect-square items-center justify-center rounded-[22px] p-3 ${theme.frameClass}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="Backup Pass QR code"
            className="h-full w-full rounded-[14px] object-contain"
          />
        </div>
      </div>

      <div className="relative text-center">
        <p
          className={`font-mono text-xs font-semibold tracking-wider ${theme.tokenClass}`}
        >
          {token}
        </p>
        <p className={`mt-1 text-[11px] ${theme.mutedClass}`}>
          Single use · auto-rotates every {refreshSeconds}s
        </p>
      </div>
    </div>
  );
}
