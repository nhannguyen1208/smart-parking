"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MobileAppHeader } from "@/components/layout/mobile-app-header";
import {
  LiveParkingRadar,
  type RadarLot,
} from "@/components/parking/live-parking-radar";
import { Card } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";

type RadarPayload = {
  campus: {
    latitude: number;
    longitude: number;
    zoom: number;
    label: string;
  };
  lots: RadarLot[];
  legend: Array<{ status: string; label: string; color: string }>;
  updatedAt: string;
};

function statusVi(status: string) {
  if (status === "AVAILABLE") return "Còn chỗ";
  if (status === "NEARLY_FULL") return "Sắp đầy";
  if (status === "FULL") return "Hết chỗ";
  return status;
}

export default function ParkingPage() {
  const [data, setData] = useState<RadarPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const radar = await api.v1.parkingRadar();
      setData(radar);
      setError(null);
      setSelectedId((prev) => {
        if (prev && radar.lots.some((l) => l.id === prev)) return prev;
        const best = [...radar.lots]
          .filter((l) => l.status === "AVAILABLE")
          .sort((a, b) => b.availableEstimate - a.availableEstimate)[0];
        return best?.id ?? radar.lots[0]?.id ?? null;
      });
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Không tải được Live Parking Radar",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      load().catch(() => undefined);
    }, 8000);
    return () => clearInterval(t);
  }, [load]);

  const selected = data?.lots.find((l) => l.id === selectedId) ?? null;
  const openSpots =
    data?.lots.reduce((sum, l) => sum + l.availableEstimate, 0) ?? 0;

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-sm text-muted">Đang mở Live Parking Radar…</p>
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell>
        <p className="rounded-[10px] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
          {error ?? "Radar unavailable"}
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="app-page space-y-4 md:space-y-5">
        <MobileAppHeader title="Live Radar" />

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {data.legend.map((item) => (
            <span
              key={item.status}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-border"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: item.color }}
              />
              {item.label}
            </span>
          ))}
          <span className="ml-auto text-muted">
            ~{openSpots} chỗ trống · cập nhật{" "}
            {new Date(data.updatedAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>

        <LiveParkingRadar
          lots={data.lots}
          center={data.campus}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {selected ? (
          <Card className="space-y-2 p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-navy">{selected.name}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {selected.locationDescription || selected.code}
                </p>
              </div>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                style={{ background: selected.radarColor }}
              >
                {statusVi(selected.status)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-1 text-center">
              <div className="rounded-[12px] bg-surface px-2 py-3">
                <p className="text-xl font-semibold text-navy">
                  {selected.availableEstimate}
                </p>
                <p className="text-[11px] text-muted">Còn trống</p>
              </div>
              <div className="rounded-[12px] bg-surface px-2 py-3">
                <p className="text-xl font-semibold text-navy">
                  {selected.totalCapacity}
                </p>
                <p className="text-[11px] text-muted">Sức chứa</p>
              </div>
              <div className="rounded-[12px] bg-surface px-2 py-3">
                <p className="text-xl font-semibold text-navy">{selected.fillPct}%</p>
                <p className="text-[11px] text-muted">Đã đầy</p>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${selected.fillPct}%`,
                  background: selected.radarColor,
                }}
              />
            </div>
          </Card>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          {data.lots.map((lot) => {
            const active = lot.id === selectedId;
            return (
              <button
                key={lot.id}
                type="button"
                onClick={() => setSelectedId(lot.id)}
                className={`rounded-[16px] border p-4 text-left transition ${
                  active
                    ? "border-brand-blue bg-brand-light/40 shadow-[0_10px_28px_rgba(0,93,170,0.12)]"
                    : "border-border/80 bg-white hover:border-brand-blue/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-navy">{lot.name}</p>
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: lot.radarColor }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {lot.availableEstimate} / {lot.totalCapacity} trống
                </p>
                <p className="mt-2 text-[11px] font-semibold" style={{ color: lot.radarColor }}>
                  {statusVi(lot.status)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
