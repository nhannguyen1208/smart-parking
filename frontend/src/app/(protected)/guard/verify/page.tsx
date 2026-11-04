"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function GuardVerifyPage() {
  const [credentialRaw, setCredentialRaw] = useState("RFID-A1B2C3");
  const [guestToken, setGuestToken] = useState("");
  const [eventType, setEventType] = useState<"AUTO" | "ENTRY" | "EXIT">("AUTO");
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
        gateCode: eventType === "EXIT" ? "GATE_A_OUT" : "GATE_A_IN",
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

  const resolved = String(result?.eventType || "");
  const outcome = String(result?.result || "");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
          Guard · Gate
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">
          Check-in / Check-out
        </h1>
        <p className="mt-1 text-sm text-muted">
          Cùng pipeline với ESP32. Chế độ <strong>AUTO</strong>: chưa đỗ →
          check-in, đang đỗ → check-out. Thẻ mới?{" "}
          <Link href="/guard/cards" className="font-medium text-brand-blue underline">
            Đăng ký thẻ RFID
          </Link>
          .
        </p>
      </div>

      <Card className="p-5">
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-xs font-medium text-muted">
            Chế độ
            <select
              className="mt-1 h-11 w-full rounded-xl border border-border px-3 text-sm"
              value={eventType}
              onChange={(e) =>
                setEventType(e.target.value as "AUTO" | "ENTRY" | "EXIT")
              }
            >
              <option value="AUTO">AUTO — tự check-in / check-out</option>
              <option value="ENTRY">ENTRY — buộc check-in</option>
              <option value="EXIT">EXIT — buộc check-out</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-muted">
            RFID UID / credential
            <Input
              className="mt-1 font-mono"
              value={credentialRaw}
              onChange={(e) => setCredentialRaw(e.target.value.toUpperCase())}
              disabled={Boolean(guestToken)}
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            Hoặc Backup Pass token
            <Input
              className="mt-1"
              value={guestToken}
              onChange={(e) => setGuestToken(e.target.value)}
              placeholder="Paste GP-… token"
            />
          </label>
          {error ? <p className="text-sm text-brand-red">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Processing…" : "Chạy check-in / check-out"}
          </Button>
        </form>
      </Card>

      {result ? (
        <Card className="space-y-2 p-4 text-sm">
          <p className="font-semibold text-navy">
            {outcome}
            {resolved ? ` · ${resolved}` : ""} — {String(result.reason)}
          </p>
          {result.unregisteredCredential ? (
            <p className="text-xs text-brand-red">
              Thẻ chưa đăng ký:{" "}
              <code>{String(result.unregisteredCredential)}</code> —{" "}
              <Link href="/guard/cards" className="underline">
                đăng ký ngay
              </Link>
            </p>
          ) : null}
          {result.session ? (
            <p className="text-xs text-muted">
              Session: {JSON.stringify(result.session)}
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
