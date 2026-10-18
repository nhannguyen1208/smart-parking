export default function FeatureSheet({ open, title, subtitle, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[24px] border border-border/80 bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow-soft)] sm:rounded-[24px]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border sm:hidden" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {subtitle ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-blue">
                {subtitle}
              </p>
            ) : null}
            <h3 className="mt-1 text-lg font-semibold text-navy">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
