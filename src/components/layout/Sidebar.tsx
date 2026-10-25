"use client";

import { useAppStore } from "@/store/useAppStore";
import { NAV_ITEMS, type SidebarSection } from "@/lib/sidebar-items";
import { cn } from "@/lib/utils";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Menu, MapPin, X, Undo2 } from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  accessibleTabs: string[];
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  impersonationAdminName?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  accessibleTabs,
  collapsed,
  setCollapsed,
  mobileOpen,
  onMobileClose,
  impersonationAdminName,
}) => {
  const { currentScope } = useAppStore();

  const navItems = NAV_ITEMS.filter((item) => accessibleTabs.includes(item.id));
  const compact = collapsed && !mobileOpen;

  // The active tab is supplied by the current Inertia page.

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-16 z-40 flex flex-col border-r border-border bg-background transition-[width,transform] duration-200 lg:translate-x-0",
        compact ? "w-16" : "w-72",
        mobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Collapse toggle */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-3">
        {!compact && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-xs font-bold">SGG</span>
            </div>
            <span className="truncate font-semibold tracking-tight text-foreground">
              SGG-AC
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
          aria-label={collapsed ? "Perluas navigasi" : "Ciutkan navigasi"}
        >
          <Menu className={cn("h-4 w-4", collapsed && "rotate-90")} />
        </button>
        <button
          type="button"
          onClick={onMobileClose}
          className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          aria-label="Tutup navigasi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav aria-label="Navigasi utama" className="flex-1 space-y-4 overflow-y-auto p-2">
        {(["Ringkasan", "Pelaksanaan", "Pengelolaan"] as SidebarSection[]).map((section) => {
          const sectionItems = navItems.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;

          return (
            <div key={section} className="space-y-1">
              {!compact && (
                <h2 className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {section}
                </h2>
              )}
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onMobileClose();
                    }}
                    className={cn(
                      "flex w-full min-w-0 items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                    aria-pressed={isActive}
                    title={compact ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!compact && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border bg-background p-3 space-y-2.5">
        {impersonationAdminName && (
          compact ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-md shadow-sm"
                title={`Kembali ke Super Admin (Sesi oleh ${impersonationAdminName})`}
                aria-label="Kembali ke Super Admin"
                onClick={() => router.post("/impersonation/stop")}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-foreground space-y-2 shadow-sm">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-destructive">Sesi Impersonasi</p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Sesi oleh {impersonationAdminName}.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full h-7 text-xs font-medium justify-center gap-1.5 shadow-sm"
                onClick={() => router.post("/impersonation/stop")}
              >
                <Undo2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Kembali ke Super Admin</span>
              </Button>
            </div>
          )
        )}

        <div
          className={cn("flex items-center gap-2 text-xs text-muted-foreground", compact && "justify-center")}
          aria-label={`Lingkup: ${currentScope.name}`}
          title={compact ? `Lingkup: ${currentScope.name}` : undefined}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {!compact && <span className="truncate font-medium">Lingkup: {currentScope.name}</span>}
        </div>
      </div>
    </aside>
  );
};
