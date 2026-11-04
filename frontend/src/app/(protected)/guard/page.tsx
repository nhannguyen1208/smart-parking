"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";

export default function GuardHomePage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await api.v1.guardDashboard();
        if (!cancelled) {
          setData(next);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      }
    }
    load();
    // Live feed: ESP32 / MQTT / Verify scan → refresh danh sách event
    const timer = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const lots = (data?.lots as Array<Record<string, unknown>>) || [];
  const recent = (data?.recentEvents as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
          Guard console
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">Lot capacity & gate feed</h1>
        <p className="mt-1 text-sm text-muted">
          Estimates from gate events (auto-refresh 3s) — ESP32 physical scans
          appear here via{" "}
          <code className="text-xs">/api/v1/device/gate-events</code>.{" "}
          {data?.demoMode ? (
            <span className="font-medium text-brand-red">DEMO MODE</span>
          ) : null}
        </p>
      </div>

      {error ? (
        <Card className="p-4 text-sm text-brand-red">{error}</Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {lots.map((lot) => (
          <Card key={String(lot.id)} className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">{String(lot.code)}</p>
            <p className="mt-1 text-lg font-semibold text-navy">{String(lot.name)}</p>
            <p className="mt-2 text-sm text-navy">
              {String(lot.currentOccupancyEstimate)} / {String(lot.totalCapacity)} occupied
              (estimated)
            </p>
            <p className="mt-1 text-xs font-semibold text-brand-blue">{String(lot.status)}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <p className="text-sm font-semibold text-navy">Recent gate events</p>
        <ul className="mt-3 space-y-2">
          {recent.slice(0, 12).map((ev) => {
            const meta = (ev.metadata || {}) as { credentialRaw?: string };
            return (
              <li
                key={String(ev.eventId || ev._id)}
                className="rounded-lg bg-surface px-3 py-2 text-xs text-navy"
              >
                {String(ev.eventType)} · {String(ev.result)} · {String(ev.reason)}
                {meta.credentialRaw ? (
                  <span className="mt-0.5 block font-mono text-brand-red">
                    UID {meta.credentialRaw} — đăng ký tại /guard/cards
                  </span>
                ) : null}
              </li>
            );
          })}
          {recent.length === 0 ? (
            <li className="text-xs text-muted">
              Chưa có event — quét ESP32 hoặc dùng Check-in / Check-out.
            </li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
