"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import { peakHours } from "@/lib/mock-data";
import type { ParkingSummary } from "@/lib/types";

export default function ParkingPage() {
  const [summary, setSummary] = useState<ParkingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .dashboard()
      .then((data) => setSummary(data.parkingSummary))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Failed to load parking data");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-sm text-muted">Loading parking status...</p>
      </DashboardShell>
    );
  }

  if (error || !summary) {
    return (
      <DashboardShell>
        <p className="rounded-[10px] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
          {error ?? "Parking status unavailable"}
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            Live campus
          </p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-navy md:text-[34px]">
            Parking Status
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Real-time occupancy and peak hour insights for campus parking.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <p className="text-sm text-muted">Current occupancy</p>
            <p className="mt-3 text-5xl font-semibold tracking-tight text-navy">
              {summary.occupancy}%
            </p>
            <p className="mt-2 text-sm text-muted">{summary.occupancyLabel}</p>
            <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-blue to-[#3b82c4]"
                style={{ width: `${summary.occupancy}%` }}
              />
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted">Available spaces</p>
            <p className="mt-3 text-5xl font-semibold tracking-tight text-navy">
              {summary.totalAvailable}
            </p>
            <p className="mt-2 text-sm text-muted">
              of {summary.totalCapacity} total spaces
            </p>
            {summary.occupancy >= 90 && (
              <p className="mt-6 rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
                Parking is nearly full. Consider alternative arrival times.
              </p>
            )}
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-navy">Parking zones</h2>
          <div className="mt-4 space-y-3">
            {summary.zones.map((zone) => {
              const occupiedPct = Math.round((zone.occupied / zone.capacity) * 100);
              return (
                <div
                  key={zone.id}
                  className="rounded-[14px] bg-surface px-4 py-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-navy">{zone.name}</p>
                      <p className="text-muted">
                        {zone.available} available of {zone.capacity}
                      </p>
                    </div>
                    <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand-blue">
                      {zone.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-brand-blue/80"
                      style={{ width: `${occupiedPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-navy">Peak hours</h2>
          <div className="mt-6 flex items-end gap-3 md:gap-4">
            {peakHours.map((item) => (
              <div key={item.hour} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-blue to-[#4f8ec8]"
                  style={{ height: `${item.level * 1.2}px` }}
                />
                <span className="text-xs text-muted">{item.hour}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-navy">Access methods</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Method
              title="RFID student card"
              description="Tap your university card at the gate for automatic entry and exit."
            />
            <Method
              title="QR parking pass"
              description="Use QR Pass as backup when your card is unavailable."
            />
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Method({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[14px] border border-border/70 bg-surface p-4">
      <h3 className="font-semibold text-navy">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}
