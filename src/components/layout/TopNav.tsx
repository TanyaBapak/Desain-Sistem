"use client";

import * as React from "react";
import { useAppStore } from "@/store/useAppStore";
import { Bell, Shield, User, HelpCircle, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

interface TopNavProps {
  onOpenSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenSidebar }) => {
  const { currentUser, currentRole, currentScope, logout } = useAppStore();
  const activeRoleObj = getRoleInfo(currentRole);

  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  return (
    <div className="sticky top-0 z-50 flex flex-col border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="rounded-md p-2 text-slate-500 hover:bg-secondary hover:text-accent-foreground transition shrink-0"
            aria-label="Buka navigasi"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">SMK Go Global</span>
            <span className="text-xs text-slate-500">
              Admin Dashboard · Kementerian P2MI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Notifications */}
          <button
            className="relative p-2 text-slate-500 hover:text-slate-900 transition"
            aria-label="Notifikasi"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 flex h-1.5 w-1.5 items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-background" />
            </span>
          </button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition shrink-0">
                <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  {currentUser?.avatarInitials || "US"}
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="text-slate-700">{currentUser?.name || "Pengguna"}</span>
                  <span className="text-xs text-slate-500">{activeRoleObj.title}</span>
                </div>
                <span className="hidden md:block text-xs text-blue-600">
                  MFA Aktif
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-2">
              <DropdownMenuLabel className="text-xs font-semibold uppercase mb-1">
                Sesi Aktif
              </DropdownMenuLabel>
              <DropdownMenuItem className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                {currentUser?.name}
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 text-sm text-slate-500">
                <Shield className="h-4 w-4 text-slate-400 shrink-0" />
                {activeRoleObj.title}
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 text-sm text-slate-500">
                <MapPinIcon className="h-4 w-4 text-slate-400 shrink-0" />
                {currentScope.name}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setUserDropdownOpen(false);
                  logout();
                }}
                className="text-sm text-destructive"
              >
                <LogOutIcon className="h-4 w-4 text-red-500 shrink-0" />
                Keluar / Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

function MenuIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function LogOutIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function MapPinIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

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
