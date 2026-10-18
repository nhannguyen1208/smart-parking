"use client";

import { Suspense } from "react";
import LoginPage from "./login-page";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted">
          Loading...
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
