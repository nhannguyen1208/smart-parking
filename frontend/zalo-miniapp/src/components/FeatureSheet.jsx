export default function FeatureSheet({ open, title, subtitle, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 backdrop-blur-[2px] sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(11,46,89,0.18)] sm:rounded-[28px]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" />
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            {subtitle ? (
              <p className="text-[12px] text-muted">{subtitle}</p>
            ) : null}
            <h3 className="mt-0.5 text-[17px] font-semibold text-navy">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-surface px-3 py-1.5 text-[12px] font-semibold text-navy"
          >
            Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
