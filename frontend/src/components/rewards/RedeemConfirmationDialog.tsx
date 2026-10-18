"use client";

import { useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import type { CatalogItem } from "@/lib/rewards-types";

type RedeemConfirmationDialogProps = {
  item: CatalogItem | null;
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RedeemConfirmationDialog({
  item,
  open,
  busy = false,
  onCancel,
  onConfirm,
}: RedeemConfirmationDialogProps) {
  const titleId = useId();
  const descId = useId();
  const confirmId = useId();

  useEffect(() => {
    if (!open) return undefined;
    document.getElementById(confirmId)?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onCancel, confirmId]);

  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-navy/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-md rounded-t-[22px] border border-border bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-soft)] sm:rounded-[18px] sm:p-6 sm:pb-6"
      >
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden"
          aria-hidden
        />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
          Confirm redemption
        </p>
        <h2 id={titleId} className="mt-2 text-xl font-semibold text-navy">
          Redeem {item.name}?
        </h2>
        <div id={descId} className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <p>
            You&apos;ll spend{" "}
            <strong className="text-navy">{item.pointsCost} points</strong> for{" "}
            <strong className="text-navy">{item.benefitDays} free parking days</strong>.
          </p>
          <p>Valid for {item.validityDays} days after redemption. Points are deducted right away.</p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            disabled={busy}
            onClick={onCancel}
          >
            Keep my points
          </Button>
          <Button
            id={confirmId}
            type="button"
            className="h-11"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Redeeming…" : "Confirm redeem"}
          </Button>
        </div>
      </div>
    </div>
  );
}
