"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.v1.adminEvents().then((d) => setEvents(d as Array<Record<string, unknown>>));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-navy">Gate events</h1>
      <div className="space-y-2">
        {events.map((ev) => (
          <Card key={String(ev.eventId || ev._id)} className="p-3 text-xs">
            <p className="font-semibold text-navy">
              {String(ev.eventType)} · {String(ev.result)} · {String(ev.source)}
            </p>
            <p className="text-muted">{String(ev.reason)}</p>
            <p className="text-muted">{String(ev.eventId)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
