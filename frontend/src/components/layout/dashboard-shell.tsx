import { ParkWiseChatbot } from "@/components/chat/parkwise-chatbot";
import { AccentBar } from "@/components/layout/accent-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import type { ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="page-atmosphere min-h-screen">
      <AccentBar />
      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 py-5 md:gap-8 md:px-6 md:py-6">
        <div className="sticky top-5 hidden h-[calc(100vh-2.5rem)] shrink-0 md:block">
          <Sidebar />
        </div>
        <main className="min-w-0 flex-1 animate-fade-up pt-1 md:pt-2">
          <MobileNav />
          {children}
        </main>
      </div>
      <ParkWiseChatbot variant="floating" />
    </div>
  );
}
