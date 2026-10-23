"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  accessibleTabs: string[];
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  accessibleTabs,
  children,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-muted/30 font-sans text-foreground">
      <TopNav currentTab={currentTab} onOpenSidebar={() => setMobileSidebarOpen(true)} />
      <div className="flex min-h-[calc(100vh-4rem)]">
        {mobileSidebarOpen && (
          <button
            type="button"
            className="fixed inset-x-0 bottom-0 top-16 z-30 bg-foreground/30 lg:hidden"
            aria-label="Tutup navigasi"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <Sidebar
          currentTab={currentTab}
          onTabChange={handleTabChange}
          accessibleTabs={accessibleTabs}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <main
          className={cn(
            "min-h-[calc(100vh-4rem)] min-w-0 flex-1 px-4 py-5 transition-[margin] duration-300 sm:px-6 lg:px-8",
            collapsed ? "lg:ml-16" : "lg:ml-72"
          )}
        >
          <div className="mx-auto w-full min-w-0 max-w-screen-2xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
