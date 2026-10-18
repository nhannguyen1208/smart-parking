"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function GuardVerifyPage() {
  const [credentialRaw, setCredentialRaw] = useState("RFID-NHI-001");
  const [guestToken, setGuestToken] = useState("");
  const [eventType, setEventType] = useState<"ENTRY" | "EXIT">("ENTRY");
  const [gateCode, setGateCode] = useState("GATE_A_IN");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.v1.guardScan({
        eventType,
        gateCode,
        credentialRaw: guestToken ? undefined : credentialRaw,
        guestToken: guestToken || undefined,
      });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
          Guard · Verify
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">Simulate RFID / Backup QR</h1>
        <p className="mt-1 text-sm text-muted">
          Uses the same ParkingService as MQTT events. Labelled{" "}
          <strong>DEMO</strong> — not a physical reader.
        </p>
      </div>

      <Card className="p-5">
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-xs font-medium text-muted">
            Event type
            <select
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 text-sm"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as "ENTRY" | "EXIT")}
            >
              <option value="ENTRY">ENTRY</option>
              <option value="EXIT">EXIT</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-muted">
            Gate code
            <Input value={gateCode} onChange={(e) => setGateCode(e.target.value)} />
          </label>
          <label className="block text-xs font-medium text-muted">
            RFID credential (demo raw tag)
            <Input
              value={credentialRaw}
              onChange={(e) => setCredentialRaw(e.target.value)}
              disabled={Boolean(guestToken)}
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            Or Backup Pass token
            <Input
              value={guestToken}
              onChange={(e) => setGuestToken(e.target.value)}
              placeholder="Paste GP-… token"
            />
          </label>
          {error ? <p className="text-sm text-brand-red">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Processing…" : "Simulate scan"}
          </Button>
        </form>
      </Card>

      {result ? (
        <Card className="space-y-1 p-4 text-sm">
          <p className="font-semibold text-navy">
            {String(result.result)} — {String(result.reason)}
          </p>
          <p className="text-xs text-muted">
            source: {String(result.source || "DEMO")} · labelledDemo:{" "}
            {String(result.labelledDemo ?? true)}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
