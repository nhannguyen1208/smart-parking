export function Box({ children, className = "", title, action }) {
  return (
    <section
      className={`rounded-2xl border border-black/5 bg-white p-4 shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title ? (
            <h2 className="text-sm font-semibold text-[#0b2e59]">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
