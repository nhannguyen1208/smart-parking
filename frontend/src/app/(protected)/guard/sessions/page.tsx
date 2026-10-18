"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Session = {
  id: string;
  entryAt: string;
  status: string;
  vehicleId: string;
  lotId: string;
};

export default function GuardSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reason, setReason] = useState("Manual close — observed exit");
  const [message, setMessage] = useState("");

  async function load() {
    const data = (await api.v1.guardSessions()) as Session[];
    setSessions(data);
  }

  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);

  async function closeOne(id: string) {
    if (!reason.trim()) {
      setMessage("Reason required");
      return;
    }
    if (!window.confirm("Close this session manually?")) return;
    await api.v1.closeSession(id, reason);
    setMessage("Session closed");
    await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-navy">Active sessions</h1>
      <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <div className="space-y-2">
        {sessions.map((s) => (
          <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
            <div className="text-sm">
              <p className="font-semibold text-navy">{s.id}</p>
              <p className="text-xs text-muted">
                Entry {new Date(s.entryAt).toLocaleString()} · lot {s.lotId}
              </p>
            </div>
            <Button variant="secondary" onClick={() => closeOne(s.id)}>
              Close manually
            </Button>
          </Card>
        ))}
        {sessions.length === 0 ? (
          <p className="text-sm text-muted">No active sessions.</p>
        ) : null}
      </div>
    </div>
  );
}
