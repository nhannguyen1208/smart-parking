"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function GuardOccupancyPage() {
  const [lots, setLots] = useState<Array<Record<string, unknown>>>([]);
  const [lotId, setLotId] = useState("");
  const [observedCount, setObservedCount] = useState("0");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.v1.guardDashboard().then((d) => {
      const list = (d.lots as Array<Record<string, unknown>>) || [];
      setLots(list);
      if (list[0]) setLotId(String(list[0].id));
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!window.confirm("Reconcile occupancy with audit reason?")) return;
    try {
      await api.v1.reconcileOccupancy({
        lotId,
        observedCount: Number(observedCount),
        reason,
      });
      setMessage("Occupancy reconciled (audited)");
      const d = await api.v1.guardDashboard();
      setLots((d.lots as Array<Record<string, unknown>>) || []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-navy">Occupancy reconciliation</h1>
      <p className="text-sm text-muted">
        Counts are lot-level estimates. Manual correction requires a reason and is audited.
      </p>
      <Card className="p-5">
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-xs text-muted">
            Lot
            <select
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 text-sm"
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
            >
              {lots.map((lot) => (
                <option key={String(lot.id)} value={String(lot.id)}>
                  {String(lot.name)} ({String(lot.currentOccupancyEstimate)}/
                  {String(lot.totalCapacity)})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted">
            Observed count
            <Input
              type="number"
              value={observedCount}
              onChange={(e) => setObservedCount(e.target.value)}
            />
          </label>
          <label className="block text-xs text-muted">
            Reason (required)
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </label>
          <Button type="submit" className="w-full">
            Reconcile
          </Button>
        </form>
      </Card>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
