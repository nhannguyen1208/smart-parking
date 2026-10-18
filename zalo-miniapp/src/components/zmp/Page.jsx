/** Lightweight stand-in for ZMP UI Page shell */
export function Page({ title, children, subtitle }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-[#f4f6fb] shadow-xl">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-[#0068ff] px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
          Zalo Mini App
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-white/80">{subtitle}</p>
        ) : null}
      </header>
      <main className="space-y-4 px-4 py-4 pb-10">{children}</main>
    </div>
  );
}
