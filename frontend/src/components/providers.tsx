"use client";

import { AuthProvider } from "@/context/auth-context";
import { MembershipProvider } from "@/context/membership-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MembershipProvider>{children}</MembershipProvider>
    </AuthProvider>
  );
}
