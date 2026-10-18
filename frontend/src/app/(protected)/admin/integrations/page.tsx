"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";

export default function AdminIntegrationsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [flags, setFlags] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.v1.adminIntegrations().then((d) => setItems(d as Array<Record<string, unknown>>));
    api.v1.adminFlags().then(setFlags);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-navy">Integrations & flags</h1>
      <p className="text-sm text-muted">
        Status only — secrets are never displayed. DEMO / Not configured means not live.
      </p>
      {items.map((i) => (
        <Card key={String(i.id)} className="p-4">
          <p className="font-semibold text-navy">{String(i.name)}</p>
          <p className="text-sm text-brand-red">{String(i.status)}</p>
          <p className="text-xs text-muted">{String(i.detail)}</p>
        </Card>
      ))}
      {flags ? (
        <Card className="p-4 text-xs">
          <p className="mb-2 font-semibold text-navy">Feature flags</p>
          <pre className="overflow-auto whitespace-pre-wrap text-muted">
            {JSON.stringify(flags, null, 2)}
          </pre>
        </Card>
      ) : null}
    </div>
  );
}
