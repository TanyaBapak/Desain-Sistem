"use client";

import * as React from "react";
import { router } from "@inertiajs/react";
import { useAppStore } from "@/store/useAppStore";
import { Bell, Shield, User, ChevronDown, Menu, LogOut, MapPin, Moon, Sun } from "lucide-react";
import { NAV_ITEMS } from "@/lib/sidebar-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/toaster";

interface TopNavProps {
  currentTab: string;
  onOpenSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ currentTab, onOpenSidebar }) => {
  const { currentUser, currentRole, currentScope, logout } = useAppStore();
  const [isDarkTheme, setIsDarkTheme] = React.useState(
    () => document.documentElement.classList.contains("dark"),
  );
  const activeRoleObj = getRoleInfo(currentRole);
  const currentPage = NAV_ITEMS.find((item) => item.id === currentTab);
  const isNationalAreaFilter = currentUser?.scope.level === "national";
  const canSelectBp3miArea = currentUser?.roleName === "task_force" || isNationalAreaFilter;

  const toggleTheme = () => {
    const nextIsDark = !isDarkTheme;
    document.documentElement.classList.toggle("dark", nextIsDark);
    window.localStorage.setItem("p2mi-theme", nextIsDark ? "dark" : "light");
    setIsDarkTheme(nextIsDark);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b border-border bg-background px-4 shadow-sm sm:px-6">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            aria-label="Buka navigasi"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {currentPage?.label ?? "SGG-AC"}
            </p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              SGG-AC · Platform Monitoring SMK Go Global
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDarkTheme ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            aria-pressed={isDarkTheme}
            title={isDarkTheme ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {canSelectBp3miArea && currentUser?.bp3miAssignments?.length ? (
            <label className="flex items-center gap-2">
              <span className="sr-only">Filter area wilayah</span>
              <select
                aria-label="Filter area wilayah"
                className="h-9 w-24 max-w-36 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:max-w-48 sm:px-3 sm:text-sm"
                value={currentUser.bp3miCode ?? "all"}
                onChange={(event) => router.get(
                  window.location.pathname,
                  { bp3mi_area: event.target.value },
                  { preserveScroll: true, preserveState: false, replace: true },
                )}
              >
                <option value="all">Semua Nasional (Seluruh RI)</option>
                {currentUser.bp3miAssignments.map((assignment) => (
                  <option key={assignment.code} value={assignment.code}>{assignment.name}</option>
                ))}
              </select>
            </label>
          ) : null}
          {/* Notifications */}
          <button
            className="relative hidden rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
            aria-label="Notifikasi"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 flex h-1.5 w-1.5 items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-background" />
            </span>
          </button>

          {/* User Profile Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium transition hover:bg-secondary focus:bg-background data-[state=open]:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {currentUser?.avatarInitials || "US"}
                </div>
                <div className="hidden min-w-0 flex-col text-left sm:flex">
                  <span className="max-w-40 truncate text-foreground">{currentUser?.name || "Pengguna"}</span>
                  <span className="max-w-40 truncate text-xs text-muted-foreground">
                    {currentUser?.roleTitle ?? activeRoleObj.title}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-2">
              <DropdownMenuLabel className="text-xs font-semibold uppercase mb-1">
                Sesi Aktif
              </DropdownMenuLabel>
              <DropdownMenuItem className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                {currentUser?.name}
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
                {currentUser?.roleTitle ?? activeRoleObj.title}
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                {currentScope.name}
              </DropdownMenuItem>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                MFA: {currentUser?.mfaEnabled ? "Aktif" : "Tidak aktif"}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                }}
                className="text-sm text-destructive"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Keluar / Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Toaster />
    </header>
  );
};

function getRoleInfo(role: string) {
  const mockRoles = [
    { id: "superadmin", title: "Super Admin / Pusdatin" },
    { id: "pimpinan", title: "Menteri / Pimpinan" },
    { id: "taskforce", title: "Admin Task Force Nasional" },
    { id: "disnaker", title: "Admin Disnaker Kab/Kota" },
    { id: "vokasi", title: "Admin Lembaga Vokasi" },
    { id: "demand", title: "Admin Demand / Pemberi Kerja" },
    { id: "verifikator", title: "Verifikator Data & Dokumen" },
    { id: "matching", title: "Admin Matching & Penempatan" },
    { id: "bp3mi", title: "Admin BP3MI" },
    { id: "direktorat", title: "Direktorat PKV PMI" },
  ];
  return mockRoles.find((r) => r.id === role) || mockRoles[0];
}
