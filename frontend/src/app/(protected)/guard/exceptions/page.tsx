"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";

export default function GuardExceptionsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.v1.guardExceptions().then((d) => setItems(d as Array<Record<string, unknown>>));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-navy">Exceptions</h1>
      <p className="text-sm text-muted">Denied / needs-review gate events for guard follow-up.</p>
      <div className="space-y-2">
        {items.map((ev) => (
          <Card key={String(ev.eventId || ev._id)} className="p-4 text-sm">
            <p className="font-semibold text-navy">
              {String(ev.result)} · {String(ev.eventType)}
            </p>
            <p className="text-xs text-muted">{String(ev.reason)}</p>
          </Card>
        ))}
        {items.length === 0 ? <p className="text-sm text-muted">No exceptions.</p> : null}
      </div>
    </div>
  );
}
