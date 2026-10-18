/**
 * Lightweight chrome that reads as a Zalo Mini App shell in browser demo.
 */
export default function ZaloChrome({ title = "ParkWise", subtitle }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-1 text-[11px] text-white/45">
        <span className="font-medium tracking-wide">Zalo</span>
        <span className="tabular-nums">
          {new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0068ff]/12 px-3 py-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0068ff] text-sm font-bold text-white shadow-[0_6px_16px_rgba(0,104,255,0.35)]">
          Z
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{title}</p>
          <p className="truncate text-[11px] text-white/50">
            {subtitle ?? "VNUK Mini App · demo mode"}
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9ec5ff]">
          OA
        </span>
      </div>
    </div>
  );
}
