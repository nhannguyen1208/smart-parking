"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import type { ProfileData } from "@/lib/types";

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .profile()
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-sm text-muted">Loading profile...</p>
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell>
        <p className="rounded-[10px] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
          {error ?? "Profile unavailable"}
        </p>
      </DashboardShell>
    );
  }

  const { user, activeMembership } = data;
  const vehicleLabel =
    user.vehicleType && user.vehicleNumber
      ? `${user.vehicleType} • ${user.vehicleNumber}`
      : "Not provided";

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-[30px] font-semibold text-navy">Profile</h1>
          <p className="mt-2 text-sm text-muted">
            Your student account and parking membership details.
          </p>
        </header>

        <Card className="p-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-light text-2xl font-semibold text-brand-blue">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-navy">{user.name}</h2>
              <p className="text-sm text-muted">Student ID: {user.studentId}</p>
              <p className="mt-1 text-sm text-muted">{user.email}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Info
              label="Membership"
              value={activeMembership?.status ?? "NONE"}
            />
            <Info
              label="Valid until"
              value={activeMembership?.endDateFormatted ?? "N/A"}
            />
            <Info label="Vehicle" value={vehicleLabel} />
            <Info label="RFID card" value="Linked and active" />
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 font-medium text-navy">{value}</p>
    </div>
  );
}
