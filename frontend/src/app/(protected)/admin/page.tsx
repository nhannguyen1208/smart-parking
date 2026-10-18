"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";

export default function AdminOverviewPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.v1.adminOverview().then(setData);
  }, []);

  const integrations = (data?.integrations as Array<Record<string, unknown>>) || [];
  const lots = (data?.lots as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">ParkWise overview</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted">Users</p>
          <p className="text-2xl font-semibold text-navy">{String(data?.users ?? "—")}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Active sessions</p>
          <p className="text-2xl font-semibold text-navy">
            {String(data?.activeSessions ?? "—")}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Events today</p>
          <p className="text-2xl font-semibold text-navy">
            {String(data?.eventsToday ?? "—")}
          </p>
        </Card>
      </div>
      <Card className="p-4">
        <p className="font-semibold text-navy">Lots (estimated occupancy)</p>
        <ul className="mt-2 space-y-1 text-sm">
          {lots.map((lot) => (
            <li key={String(lot.id)}>
              {String(lot.name)}: {String(lot.currentOccupancyEstimate)}/
              {String(lot.totalCapacity)} · {String(lot.status)}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-4">
        <p className="font-semibold text-navy">Integrations</p>
        <ul className="mt-2 space-y-2 text-sm">
          {integrations.map((i) => (
            <li key={String(i.id)} className="rounded-lg bg-surface px-3 py-2">
              <span className="font-medium">{String(i.name)}</span> —{" "}
              <span className="text-brand-red">{String(i.status)}</span>
              <p className="text-xs text-muted">{String(i.detail)}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
