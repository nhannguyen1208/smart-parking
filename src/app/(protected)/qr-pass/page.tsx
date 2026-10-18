"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";

export default function QrPassPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-[30px] font-semibold text-navy">My QR Pass</h1>
          <p className="mt-2 text-sm text-muted">
            Backup parking access when your RFID card is unavailable.
          </p>
        </header>

        <Card className="p-8 text-center">
          <p className="text-sm text-muted">Student ID: {user.studentId}</p>
          <h2 className="mt-2 text-xl font-semibold text-navy">
            {user.name} • Monthly pass
          </h2>

          <div className="mx-auto mt-8 flex h-64 w-64 items-center justify-center rounded-[14px] border border-border bg-white">
            <QrPattern seed={user.studentId} />
          </div>

          <p className="mt-6 text-sm text-muted">
            Scan this code at the parking entrance reader.
          </p>
          <p className="mt-2 text-xs text-muted">
            Refreshes automatically every 60 seconds.
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-navy">How to use</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>Open QR Pass before reaching the gate.</li>
            <li>Hold your phone steady in front of the scanner.</li>
            <li>Wait for the green light and barrier to open.</li>
          </ol>
        </Card>
      </div>
    </DashboardShell>
  );
}

function QrPattern({ seed }: { seed: string }) {
  const cells = Array.from({ length: 64 }, (_, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    const hash = seed.charCodeAt(index % seed.length) + row + col;
    return hash % 2 === 0 || row === 0 || col === 0 || row === 7 || col === 7;
  });

  return (
    <div className="grid grid-cols-8 gap-1 p-4">
      {cells.map((filled, index) => (
        <div
          key={index}
          className={`h-6 w-6 ${filled ? "bg-navy" : "bg-transparent"}`}
        />
      ))}
    </div>
  );
}
