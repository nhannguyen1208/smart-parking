"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.v1.adminUsers(q).then((d) => setUsers(d as Array<Record<string, unknown>>));
  }, [q]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-navy">Users</h1>
      <Input
        placeholder="Search name, email, student ID"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="space-y-2">
        {users.map((u) => (
          <Card key={String(u.id)} className="p-4 text-sm">
            <p className="font-semibold text-navy">
              {String(u.name)} · {String(u.role)}
            </p>
            <p className="text-xs text-muted">
              {String(u.studentId)} · {String(u.email)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
