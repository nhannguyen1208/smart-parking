import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { parkingHistory } from "@/lib/mock-data";

export default function HistoryPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-[30px] font-semibold text-navy">Parking History</h1>
          <p className="mt-2 text-sm text-muted">
            Automatic entry and exit records from the campus parking system.
          </p>
        </header>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-4 gap-4 border-b border-border bg-background px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
            <span>Date</span>
            <span>Time</span>
            <span>Event</span>
            <span>Location</span>
          </div>
          {parkingHistory.map((item) => (
            <div
              key={`${item.date}-${item.time}-${item.event}`}
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
