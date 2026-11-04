"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_QR_THEME_ID,
  QR_THEMES,
  getQrTheme,
  type QrThemeId,
} from "@/lib/qr-themes";
import { useAppTheme } from "@/context/app-theme-context";

type QrThemePickerProps = {
  className?: string;
};

export function QrThemePicker({ className = "" }: QrThemePickerProps) {
  const { themeId, themesUnlocked, setThemeId } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [previewId, setPreviewId] = useState<QrThemeId | null>(null);
  const titleId = useId();
  const theme = getQrTheme(themeId);
  const preview = getQrTheme(previewId ?? themeId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setPreviewId(null);
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function pick(id: QrThemeId) {
    if (!themesUnlocked && id !== DEFAULT_QR_THEME_ID) return;
    setPreviewId(id);
    const result = await setThemeId(id);
    if (result.ok) setOpen(false);
  }

  const sheet =
    open && mounted
      ? createPortal(
          <div
            className="theme-sheet-backdrop fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="theme-sheet-panel w-full max-w-[380px] overflow-hidden rounded-t-[28px] bg-white pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_24px_80px_rgba(11,46,89,0.18)] sm:rounded-[28px]"
            >
              <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-border/90 sm:hidden" />

              {/* Live preview — one calm composition */}
              <div
                className="relative mx-4 mt-4 overflow-hidden rounded-[22px] px-5 pb-6 pt-8 transition-[background] duration-300"
                style={{
                  background: `linear-gradient(155deg, ${preview.app.card} 0%, ${preview.app["brand-light"]} 55%, ${preview.app.surface} 100%)`,
                }}
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full opacity-70 blur-2xl"
                  style={{ background: preview.blob }}
                  aria-hidden
                />
                <p
                  id={titleId}
                  className="relative text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: preview.app.muted }}
                >
                  Appearance
                </p>
                <p
                  className="relative mt-2 text-[1.65rem] font-semibold tracking-tight"
                  style={{ color: preview.app.navy }}
                >
                  {preview.label}
                </p>
                <p
                  className="relative mt-1 text-sm"
                  style={{ color: preview.app.muted }}
                >
                  {preview.description}
                </p>

                <div className="relative mt-6 flex items-end gap-3">
                  <div
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-[16px] shadow-[0_10px_28px_rgba(11,46,89,0.12)]"
                    style={{ background: preview.qr.light }}
                    aria-hidden
                  >
                    <div
                      className="grid grid-cols-3 gap-[3px]"
                      style={{ color: preview.qr.dark }}
                    >
                      {Array.from({ length: 9 }).map((_, i) => (
                        <span
                          key={i}
                          className="h-2.5 w-2.5 rounded-[2px]"
                          style={{
                            background: preview.qr.dark,
                            opacity: [0, 2, 4, 6, 8].includes(i) ? 1 : 0.35,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 pb-0.5">
                    <div
                      className="h-2.5 w-full max-w-[140px] rounded-full"
                      style={{ background: preview.app["brand-blue"], opacity: 0.9 }}
                    />
                    <div
                      className="mt-2 h-2 w-[80%] max-w-[100px] rounded-full"
                      style={{ background: preview.app.muted, opacity: 0.35 }}
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 pb-2 pt-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[13px] font-medium text-navy">Chọn màu</p>
                  {!themesUnlocked ? (
                    <Link
                      href="/membership/plans"
                      onClick={() => setOpen(false)}
                      className="text-[12px] font-medium text-brand-blue underline-offset-2 hover:underline"
                    >
                      Mở bằng membership
                    </Link>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap justify-between gap-y-4 px-0.5">
                  {QR_THEMES.map((item) => {
                    const selected = item.id === (previewId ?? themeId);
                    const locked =
                      !themesUnlocked && item.id !== DEFAULT_QR_THEME_ID;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={locked}
                        onMouseEnter={() => {
                          if (!locked) setPreviewId(item.id);
                        }}
                        onMouseLeave={() => setPreviewId(null)}
                        onFocus={() => {
                          if (!locked) setPreviewId(item.id);
                        }}
                        onBlur={() => setPreviewId(null)}
                        onClick={() => void pick(item.id)}
                        aria-pressed={item.id === themeId}
                        aria-label={item.label}
                        className="group flex w-[52px] flex-col items-center gap-2 disabled:cursor-not-allowed"
                      >
                        <span
                          className={`relative flex h-11 w-11 items-center justify-center rounded-full transition duration-200 ${
                            selected
                              ? "scale-105 ring-[2.5px] ring-navy ring-offset-2 ring-offset-white"
                              : "ring-1 ring-black/8 group-hover:ring-black/20"
                          } ${locked ? "opacity-40" : ""}`}
                        >
                          <span
                            className="absolute inset-[3px] overflow-hidden rounded-full"
                            aria-hidden
                          >
                            <span
                              className="absolute inset-y-0 left-0 w-1/2"
                              style={{ background: item.qr.dark }}
                            />
                            <span
                              className="absolute inset-y-0 right-0 w-1/2"
                              style={{ background: item.qr.light }}
                            />
                          </span>
                        </span>
                        <span
                          className={`max-w-[52px] truncate text-center text-[10px] leading-tight ${
                            selected
                              ? "font-semibold text-navy"
                              : "font-medium text-muted"
                          }`}
                        >
                          {item.label.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end border-t border-border/70 px-5 pt-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-1.5 text-[13px] font-medium text-navy transition hover:bg-surface"
                >
                  Xong
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-[var(--shadow-card)] ring-1 ring-border transition active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${className}`}
        aria-label={`Theme: ${theme.label}`}
        title={theme.label}
      >
        <span
          className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-black/10"
          aria-hidden
        >
          <span
            className="absolute inset-y-0 left-0 w-1/2"
            style={{ background: theme.qr.dark }}
          />
          <span
            className="absolute inset-y-0 right-0 w-1/2"
            style={{ background: theme.qr.light }}
          />
        </span>
      </button>
      {sheet}
    </>
  );
}
