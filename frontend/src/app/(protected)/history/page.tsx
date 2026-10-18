import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MobileAppHeader } from "@/components/layout/mobile-app-header";
import { Card } from "@/components/ui/card";
import { parkingHistory } from "@/lib/mock-data";

export default function HistoryPage() {
  return (
    <DashboardShell>
      <div className="app-page space-y-4 md:space-y-6">
        <MobileAppHeader title="History" subtitle="Entry & exit records" />

        <header className="hidden md:block">
          <h1 className="text-[30px] font-semibold text-navy">Parking History</h1>
          <p className="mt-2 text-sm text-muted">
            Automatic entry and exit records from the campus parking system.
          </p>
        </header>

        {/* Mobile list */}
        <ul className="space-y-2 md:hidden">
          {parkingHistory.map((item) => (
            <li key={`${item.date}-${item.time}-${item.event}`}>
              <Card className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold capitalize text-navy">
                    {item.event}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {item.date} · {item.time}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">Main campus gate</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    item.event === "entry"
                      ? "bg-brand-light/80 text-brand-blue"
                      : "bg-surface text-navy"
                  }`}
                >
                  {item.event}
                </span>
              </Card>
            </li>
          ))}
        </ul>

        {/* Desktop table */}
        <Card className="hidden overflow-hidden md:block">
          <div className="grid grid-cols-4 gap-4 border-b border-border bg-background px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
            <span>Date</span>
            <span>Time</span>
            <span>Event</span>
            <span>Location</span>
          </div>
          {parkingHistory.map((item) => (
            <div
              key={`${item.date}-${item.time}-${item.event}-desk`}
              className="grid grid-cols-4 gap-4 border-b border-border px-5 py-4 text-sm last:border-b-0"
            >
              <span className="text-navy">{item.date}</span>
              <span className="text-navy">{item.time}</span>
              <span className="capitalize text-muted">{item.event}</span>
              <span className="text-muted">Main campus gate</span>
            </div>
          ))}
        </Card>
      </div>
    </DashboardShell>
  );
}
