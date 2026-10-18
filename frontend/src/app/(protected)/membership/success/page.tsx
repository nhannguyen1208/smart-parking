"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";

/** Legacy bookmark: forward to Membership with live status. */
function SuccessRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const plan = searchParams.get("plan");
    const until = searchParams.get("until");
    const qs = new URLSearchParams({ activated: "1" });
    if (plan) qs.set("plan", plan);
    if (until) qs.set("until", until);
    router.replace(`/membership?${qs.toString()}`);
  }, [router, searchParams]);

  return (
    <Card className="p-10">
      <p className="text-sm text-muted">Updating membership…</p>
    </Card>
  );
}

export default function MembershipSuccessPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-xl space-y-6 pt-10 text-center">
        <Suspense
          fallback={
            <Card className="p-10">
              <p className="text-sm text-muted">Loading…</p>
            </Card>
          }
        >
          <SuccessRedirect />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
