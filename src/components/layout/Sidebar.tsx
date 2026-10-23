"use client";

import * as React from "react";
import { useAppStore } from "@/store/useAppStore";
import { mockRoles, mockUsers } from "@/data";
import { NAV_ITEMS } from "@/lib/sidebar-items";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu, ChevronDown, Shield, MapPin } from "lucide-react";
import { UserRole } from "@/types";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  collapsed,
  setCollapsed,
}) => {
  const {
    currentRole,
    currentScope,
    currentUser,
    logout,
    switchRoleContext,
  } = useAppStore();

  const activeRoleObj = mockRoles.find((r) => r.id === currentRole) || mockRoles[0];

  const navItems = NAV_ITEMS.filter((item) => {
    if (!item.accessibleRoles) return true;
    return item.accessibleRoles.includes(currentRole);
  });

  // Safeguard
  React.useEffect(() => {
    if (!navItems.some((i) => i.id === currentTab)) {
      onTabChange(navItems[0]?.id || "overview");
    }
  }, [currentRole, currentTab, navItems, onTabChange]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-background/95 backdrop-blur-md transition-all duration-300",
        collapsed
          ? "w-16 -translate-x-full md:-translate-x-0 md:w-16"
          : "w-64 md:w-64 translate-x-0"
      )}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-between px-3 py-3 bg-background border-b border-border shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">
              <span className="text-xs font-bold">SGG</span>
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              SMK Go Global
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-secondary hover:text-accent-foreground transition"
          aria-label="Toggle sidebar"
        >
          <Menu className={cn("h-4 w-4", collapsed && "rotate-90")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600/10 text-blue-600 border-r-2 border-blue-600"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
              aria-pressed={isActive}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-blue-600")} />
              {!collapsed && item.label}
              {item.badge !== undefined && !collapsed && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: Role & scope context + logout */}
      <div className="border-t border-border p-3 shrink-0">
        {!collapsed && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 mb-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 truncate">
                Scope: {currentScope.name}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition">
                  <Shield className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{activeRoleObj.title}</span>
                  <ChevronDown className="ml-auto h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-2">
                <DropdownMenuLabel className="text-xs font-semibold uppercase mb-1">
                  Ganti Akun Stakeholder
                </DropdownMenuLabel>
                {mockUsers.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() => {
                      // loginWithAccount is in store; import inline
                      useAppStore.getState().loginWithAccount(user);
                    }}
                    className={cn(
                      currentUser?.id === user.id
                        ? "bg-blue-50 text-blue-900 font-bold"
                        : "",
                      "text-xs"
                    )}
                  >
                    {user.name}
                    <span className="ml-auto text-[10px] text-slate-400">
                      {user.roleTitle}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                  }}
                  className="text-xs text-destructive"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Keluar / Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </aside>
  );
};
