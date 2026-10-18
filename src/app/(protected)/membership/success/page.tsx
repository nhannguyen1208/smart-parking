import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function MembershipSuccessPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-xl space-y-6 pt-10 text-center">
        <Card className="p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7ee] text-2xl text-[#15803d]">
            ✓
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-navy">
            Membership activated
          </h1>
          <p className="mt-3 text-sm text-muted">
            Your campus parking access is now active until 30 Sep 2026.
          </p>
          <Button href="/dashboard" className="mt-8 w-full">
            Back to dashboard
          </Button>
        </Card>
      </div>
    </DashboardShell>
  );
}
