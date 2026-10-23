import {
  Activity,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Link2,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SidebarSection = "Ringkasan" | "Pelaksanaan" | "Pengelolaan";

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  section: SidebarSection;
}

export const NAV_ITEMS: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Ringkasan" },
  { id: "reports", label: "Laporan", icon: BarChart3, section: "Ringkasan" },
  { id: "modul-a", label: "Pencari Kerja", icon: Users, section: "Pelaksanaan" },
  { id: "modul-b", label: "Program Pelatihan", icon: BookOpen, section: "Pelaksanaan" },
  { id: "modul-c", label: "Lembaga Vokasi", icon: Building2, section: "Pelaksanaan" },
  { id: "modul-d", label: "Permintaan Tenaga Kerja", icon: Briefcase, section: "Pelaksanaan" },
  { id: "matching", label: "Pencocokan", icon: Link2, section: "Pelaksanaan" },
  { id: "sippmi-monitoring", label: "Pemantauan", icon: Activity, section: "Pelaksanaan" },
  { id: "approvals", label: "Verifikasi", icon: ClipboardCheck, section: "Pelaksanaan" },
  { id: "rbac", label: "Pengelola Pengguna", icon: Settings, section: "Pengelolaan" },
  { id: "audit", label: "Jejak Audit", icon: ShieldCheck, section: "Pengelolaan" },
  { id: "integrations", label: "Integrasi", icon: Link2, section: "Pengelolaan" },
];
