"use client";

import { Suspense } from "react";
import MembershipPlansContent from "./membership-plans-content";

export default function MembershipPlansPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading plan details...</p>}>
      <MembershipPlansContent />
    </Suspense>
  );
}
