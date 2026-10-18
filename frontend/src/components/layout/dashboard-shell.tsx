import { ParkWiseChatbot } from "@/components/chat/parkwise-chatbot";
import { AccentBar } from "@/components/layout/accent-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import type { ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="page-atmosphere min-h-dvh">
      <AccentBar />
      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))] md:gap-8 md:px-6 md:pb-6 md:pt-6">
        <div className="sticky top-5 hidden h-[calc(100vh-2.5rem)] shrink-0 md:block">
          <Sidebar />
        </div>
        <main className="min-w-0 flex-1 animate-fade-up pt-0.5 md:pt-2">
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <ParkWiseChatbot variant="floating" />
    </div>
  );
}
