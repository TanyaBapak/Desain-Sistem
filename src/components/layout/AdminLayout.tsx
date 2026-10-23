"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  accessibleTabs: string[];
  impersonationAdminName: string | null;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  accessibleTabs,
  impersonationAdminName,
  children,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-muted/30 font-sans text-foreground">
      <TopNav currentTab={currentTab} onOpenSidebar={() => setMobileSidebarOpen(true)} />
      <div
        className={cn(
          "min-h-[calc(100vh-4rem)] w-full max-w-full pt-16 transition-[padding] duration-300",
          collapsed ? "lg:pl-16" : "lg:pl-72"
        )}
      >
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
        <main className="min-h-[calc(100vh-4rem)] w-full min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full min-w-0 max-w-screen-2xl">{children}</div>
          {impersonationAdminName && (
            <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-3xl flex-col gap-3 rounded-lg border border-destructive/40 bg-background p-4 text-foreground shadow-lg sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-destructive">Anda sedang masuk sebagai pengguna lain</p>
                <p className="text-sm text-muted-foreground">
                  Sesi dimulai oleh {impersonationAdminName}. Aktivitas tetap tercatat pada jejak audit.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => router.post("/impersonation/stop")}
              >
                Kembali ke Super Admin
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
