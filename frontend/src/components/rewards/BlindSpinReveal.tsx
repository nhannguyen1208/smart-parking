"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { giftImageFor } from "@/lib/gift-images";
import type { BlindPrizePreview } from "@/lib/rewards-types";

type BlindSpinRevealProps = {
  open: boolean;
  boxName: string;
  prize: BlindPrizePreview | null;
  pool: BlindPrizePreview[];
  onDone: () => void;
};

const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  lucky: "Lucky",
  rare: "Rare",
  epic: "Epic",
};

const RARITY_PILL: Record<string, string> = {
  common: "bg-surface text-navy",
  lucky: "bg-[#fff4d6] text-[#9a6700]",
  rare: "bg-brand-light text-brand-blue",
  epic: "bg-[#fde8ef] text-brand-red",
};

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function sliceColor(rarity: string, index: number) {
  if (rarity === "epic") return index % 2 === 0 ? "#891635" : "#a31d42";
  if (rarity === "rare") return index % 2 === 0 ? "#005daa" : "#0b4f8a";
  if (rarity === "lucky") return index % 2 === 0 ? "#c9850a" : "#e0a01a";
  return index % 2 === 0 ? "#0b2e59" : "#163f73";
}

export function BlindSpinReveal({
  open,
  boxName,
  prize,
  pool,
  onDone,
}: BlindSpinRevealProps) {
  const [phase, setPhase] = useState<"spin" | "reveal">("spin");
  const [rotation, setRotation] = useState(0);

  const { segments, winIndex } = useMemo(() => {
    const base = [...(pool.length > 0 ? pool : prize ? [prize] : [])];
    if (prize && !base.some((p) => p.key === prize.key || p.name === prize.name)) {
      base.unshift(prize);
    }
    if (base.length === 0) return { segments: [] as BlindPrizePreview[], winIndex: 0 };

    let segments = base.slice(0, 8);
    if (segments.length < 6) {
      const padded = [...segments];
      while (padded.length < 6) padded.push(...base);
      segments = padded.slice(0, 6);
    }

    const winIndex = Math.max(
      0,
      segments.findIndex(
        (s) => prize && (s.key === prize.key || s.name === prize.name),
      ),
    );
    return { segments, winIndex };
  }, [pool, prize]);

  useEffect(() => {
    if (!open || !prize || segments.length === 0) return undefined;
    setPhase("spin");
    setRotation(0);

    const slice = 360 / segments.length;
    const targetSliceAngle = winIndex * slice + slice / 2;
    const finalRotation = 360 * 5 + (360 - targetSliceAngle);

    const start = performance.now();
    const duration = 4000;
    let raf = 0;
    let revealTimer = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setRotation(finalRotation * easeOutCubic(t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setRotation(finalRotation);
        revealTimer = window.setTimeout(() => setPhase("reveal"), 320);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(revealTimer);
    };
  }, [open, prize, segments, winIndex]);

  if (!open || !prize) return null;

  const wonSrc = giftImageFor(prize.name, prize.image);
  const n = segments.length;
  const slice = 360 / n;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-navy/55 p-0 backdrop-blur-[4px] sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Prize wheel"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-t-[28px] border border-border/80 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 text-navy shadow-[var(--shadow-soft)] sm:rounded-[28px] sm:px-7 sm:pb-7">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-brand-light/70 to-transparent"
          aria-hidden
        />

        <div className="relative text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-blue">
            {boxName}
          </p>
          <h2 className="mt-1.5 text-[1.45rem] font-semibold tracking-tight text-navy">
            {phase === "spin" ? "Spinning for your gift" : "You got a gift"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {phase === "spin"
              ? "Hang tight — landing soon"
              : "Added to My gifts when you collect"}
          </p>
        </div>

        <div className="relative mx-auto mt-5 flex h-[292px] w-[292px] items-center justify-center sm:h-[312px] sm:w-[312px]">
          <div className="absolute top-0 z-30" aria-hidden>
            <div className="h-0 w-0 border-l-[12px] border-r-[12px] border-t-[18px] border-l-transparent border-r-transparent border-t-brand-red drop-shadow-md" />
          </div>

          <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-brand-blue to-navy p-[6px] shadow-[0_16px_40px_rgba(11,46,89,0.22)]">
            <div className="h-full w-full rounded-full bg-white p-[6px]">
              <div className="relative h-full w-full overflow-hidden rounded-full ring-1 ring-border">
                <div
                  className="absolute inset-0 will-change-transform"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <svg viewBox="0 0 200 200" className="h-full w-full">
                    {segments.map((seg, i) => {
                      const start = (i * slice - 90) * (Math.PI / 180);
                      const end = ((i + 1) * slice - 90) * (Math.PI / 180);
                      const x1 = 100 + 98 * Math.cos(start);
                      const y1 = 100 + 98 * Math.sin(start);
                      const x2 = 100 + 98 * Math.cos(end);
                      const y2 = 100 + 98 * Math.sin(end);
                      const large = slice > 180 ? 1 : 0;
                      const d = `M100,100 L${x1},${y1} A98,98 0 ${large} 1 ${x2},${y2} Z`;
                      return (
                        <path
                          key={`${seg.key}-${i}`}
                          d={d}
                          fill={sliceColor(seg.rarity, i)}
                          stroke="rgba(255,255,255,0.35)"
                          strokeWidth="1"
                        />
                      );
                    })}
                  </svg>

                  {segments.map((seg, i) => {
                    const angle = ((i + 0.5) * slice - 90) * (Math.PI / 180);
                    const r = 33;
                    const x = 50 + r * Math.cos(angle);
                    const y = 50 + r * Math.sin(angle);
                    const src = giftImageFor(seg.name, seg.image);
                    return (
                      <div
                        key={`icon-${seg.key}-${i}`}
                        className="absolute h-11 w-11 overflow-hidden rounded-[12px] bg-white shadow-[0_6px_14px_rgba(11,46,89,0.2)] ring-2 ring-white"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </div>
                    );
                  })}
                </div>

                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[11px] font-bold uppercase tracking-[0.12em] text-navy shadow-[var(--shadow-card)] ring-2 ring-brand-blue/25">
                    {phase === "spin" ? "Go" : "Win"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {phase === "reveal" ? (
          <div className="relative mt-5 text-center">
            <div className="blind-reveal-pop mx-auto overflow-hidden rounded-[20px] border border-border bg-white p-4 shadow-[var(--shadow-card)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={wonSrc}
                alt={prize.name}
                className="mx-auto h-36 w-36 rounded-[16px] object-cover ring-1 ring-border"
              />
              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                  RARITY_PILL[prize.rarity] ?? RARITY_PILL.common
                }`}
              >
                {RARITY_LABEL[prize.rarity] ?? prize.rarity}
              </span>
              <p className="mt-2 text-xl font-semibold tracking-tight text-navy">
                {prize.name}
              </p>
              <p className="mt-1 text-sm text-muted">
                {prize.benefitDays > 0
                  ? `${prize.benefitDays} free parking day${prize.benefitDays === 1 ? "" : "s"}`
                  : "Saved to My gifts"}
              </p>
            </div>
            <Button
              type="button"
              className="mt-4 h-12 w-full"
              onClick={onDone}
            >
              Collect gift
            </Button>
          </div>
        ) : (
          <p className="relative mt-5 pb-1 text-center text-sm text-muted">
            The pointer marks your prize…
          </p>
        )}
      </div>
    </div>
  );
}
