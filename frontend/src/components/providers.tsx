"use client";

import { AuthProvider } from "@/context/auth-context";
import { AppThemeProvider } from "@/context/app-theme-context";
import { MembershipProvider } from "@/context/membership-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MembershipProvider>
        <AppThemeProvider>{children}</AppThemeProvider>
      </MembershipProvider>
    </AuthProvider>
  );
}
