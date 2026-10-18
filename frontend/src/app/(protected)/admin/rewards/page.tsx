"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api-client";

type Mission = {
  id: string;
  name: string;
  description: string;
  windowStart: string;
  windowEnd: string;
  pointsAwarded: number;
  isActive: boolean;
  daysOfWeek: number[];
};

type CatalogReward = {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  benefitDays: number;
  validityDays: number;
  isActive: boolean;
};

export default function AdminRewardsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [catalog, setCatalog] = useState<CatalogReward[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [mStart, setMStart] = useState("07:10");
  const [mEnd, setMEnd] = useState("07:20");
  const [mPoints, setMPoints] = useState("10");

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, c, s] = await Promise.all([
        api.v1.adminRewardMissions(),
        api.v1.adminRewardCatalog(),
        api.v1.adminRewardStats(),
      ]);
      setMissions(m.missions as Mission[]);
      setCatalog(c.rewards as CatalogReward[]);
      setStats(s as Record<string, number>);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveActiveMission() {
    const active = missions.find((m) => m.isActive) ?? missions[0];
    if (!active) return;
    setMsg(null);
    try {
      await api.v1.patchRewardMission(active.id, {
        windowStart: mStart,
        windowEnd: mEnd,
        pointsAwarded: Number(mPoints) || 10,
        isActive: true,
      });
      setMsg("Mission updated.");
      await load();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  async function toggleReward(r: CatalogReward) {
    try {
      await api.v1.patchRewardCatalog(r.id, { isActive: !r.isActive });
      await load();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  useEffect(() => {
    const active = missions.find((m) => m.isActive);
    if (active) {
      setMStart(active.windowStart);
      setMEnd(active.windowEnd);
      setMPoints(String(active.pointsAwarded));
    }
  }, [missions]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-navy">
            Rewards configuration
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage early-arrival missions and redemption catalog.
          </p>
        </header>

        {error ? (
          <p className="rounded-[10px] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
            {error}
          </p>
        ) : null}
        {msg ? (
          <p className="rounded-[10px] bg-[#e8f7ee] px-3 py-2 text-sm text-[#15803d]">
            {msg}
          </p>
        ) : null}

        {stats ? (
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Earn events", stats.earnEvents],
              ["Points awarded", stats.pointsAwarded],
              ["Redemptions", stats.redemptions],
              ["Active missions", stats.activeMissions],
            ].map(([label, value]) => (
              <Card key={String(label)} className="p-4">
                <p className="text-xs text-muted">{label}</p>
                <p className="text-2xl font-semibold text-navy">{value}</p>
              </Card>
            ))}
          </div>
        ) : null}

        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold text-navy">Active mission window</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Start (HH:mm)"
              value={mStart}
              onChange={(e) => setMStart(e.target.value)}
            />
            <Input
              label="End (HH:mm)"
              value={mEnd}
              onChange={(e) => setMEnd(e.target.value)}
            />
            <Input
              label="Points"
              value={mPoints}
              onChange={(e) => setMPoints(e.target.value)}
            />
          </div>
          <Button type="button" onClick={saveActiveMission}>
            Save mission
          </Button>
          <ul className="space-y-2 text-sm">
            {missions.map((m) => (
              <li key={m.id} className="rounded-[10px] bg-surface px-3 py-2">
                <span className="font-medium text-navy">{m.name}</span>
                {" · "}
                {m.windowStart}–{m.windowEnd} · +{m.pointsAwarded} pts ·{" "}
                {m.isActive ? "Active" : "Off"}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3 p-5">
          <h2 className="text-lg font-semibold text-navy">Catalog</h2>
          {catalog.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-border/80 px-3 py-3"
            >
              <div>
                <p className="font-semibold text-navy">{r.name}</p>
                <p className="text-xs text-muted">
                  {r.pointsCost} pts · {r.benefitDays} days · valid {r.validityDays}d ·{" "}
                  {r.isActive ? "Active" : "Disabled"}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => toggleReward(r)}
              >
                {r.isActive ? "Disable" : "Enable"}
              </Button>
            </div>
          ))}
        </Card>
      </div>
    </DashboardShell>
  );
}
