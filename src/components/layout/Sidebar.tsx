"use client";

import * as React from "react";
import { useAppStore } from "@/store/useAppStore";
import { mockRoles } from "@/data";
import { NAV_ITEMS } from "@/lib/sidebar-items";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu, ChevronDown, Shield, MapPin, X } from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  accessibleTabs: string[];
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  accessibleTabs,
  collapsed,
  setCollapsed,
  mobileOpen,
  onMobileClose,
}) => {
  const {
    currentRole,
    currentScope,
    currentUser,
    logout,
  } = useAppStore();

  const activeRoleObj = mockRoles.find((r) => r.id === currentRole) || mockRoles[0];

  const navItems = NAV_ITEMS.filter((item) => accessibleTabs.includes(item.id));
  const compact = collapsed && !mobileOpen;

  // The active tab is supplied by the current Inertia page.

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-16 z-40 flex flex-col border-r border-border bg-background transition-[width,transform] duration-200 md:translate-x-0",
        compact ? "w-16 md:w-16" : "w-72 md:w-64",
        mobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0"
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
              SMK Go Global
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
          aria-label={collapsed ? "Perluas navigasi" : "Ciutkan navigasi"}
        >
          <Menu className={cn("h-4 w-4", collapsed && "rotate-90")} />
        </button>
        <button
          type="button"
          onClick={onMobileClose}
          className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          aria-label="Tutup navigasi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav aria-label="Navigasi utama" className="flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map((item) => {
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
              <Icon className="h-4 w-4 shrink-0" />
              {!compact && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
              {item.badge !== undefined && !compact && (
                <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-semibold tabular-nums text-primary">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Role & scope context + logout */}
      <div className="border-t border-border p-3 shrink-0">
        {!compact && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 mb-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-xs text-muted-foreground">
                Lingkup: {currentScope.name}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{currentUser?.roleTitle ?? activeRoleObj.title}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="truncate">{currentUser?.name ?? "Pengguna"}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-2">
                <DropdownMenuLabel className="text-xs font-semibold uppercase">
                  Sesi aktif
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-xs text-destructive">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Keluar / Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {compact && (
          <button
            type="button"
            onClick={logout}
            className="flex w-full justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Keluar"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
