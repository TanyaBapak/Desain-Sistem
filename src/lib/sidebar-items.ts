import {
  Compass,
  Users,
  GraduationCap,
  Building2,
  Globe2,
  Workflow,
  CheckCircle2,
  Terminal,
  Key,
  Monitor,
  Shield,
  Clock,
  AlertCircle,
} from "lucide-react";

export interface SidebarItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ElementType;
  badge?: number | string;
  accessibleRoles?: string[]; // role IDs allowed to see this item
  requiresAuth?: boolean;
}

export const NAV_ITEMS: SidebarItem[] = [
  {
    id: "overview",
    label: "Dasbor Eksekutif",
    icon: Compass,
    accessibleRoles: [
      "superadmin",
      "pimpinan",
      "taskforce",
      "disnaker",
      "vokasi",
      "demand",
      "verifikator",
      "matching",
    ],
  },
  {
    id: "modul-a",
    label: "Pencari Kerja",
    icon: Users,
    badge: 0,
    accessibleRoles: ["superadmin", "taskforce", "disnaker", "vokasi", "verifikator", "matching"],
  },
  {
    id: "modul-b",
    label: "Program Pelatihan",
    icon: GraduationCap,
    accessibleRoles: ["superadmin", "taskforce", "direktorat", "vokasi", "verifikator", "matching"],
  },
  {
    id: "modul-c",
    label: "Lembaga Vokasi",
    icon: Building2,
    badge: 0,
    accessibleRoles: ["superadmin", "taskforce", "direktorat", "vokasi", "verifikator", "disnaker"],
  },
  {
    id: "modul-d",
    label: "Permintaan Tenaga Kerja",
    icon: Globe2,
    badge: 0,
    accessibleRoles: ["superadmin", "taskforce", "direktorat", "demand", "verifikator", "matching"],
  },
  {
    id: "modul-e",
    label: "Pencocokan & Pemantauan",
    icon: Workflow,
    badge: 0,
    accessibleRoles: ["superadmin", "taskforce", "bp3mi", "matching", "verifikator", "demand", "pimpinan"],
  },
  {
    id: "sippmi-monitoring",
    label: "Pemantauan SIPPMI",
    icon: Monitor,
    accessibleRoles: ["superadmin", "taskforce", "bp3mi", "matching", "direktorat", "pimpinan"],
  },
  {
    id: "approvals",
    label: "Persetujuan Data",
    icon: CheckCircle2,
    badge: 0,
    accessibleRoles: ["superadmin", "taskforce", "verifikator", "disnaker", "vokasi", "demand"],
  },
  {
    id: "audit",
    label: "Riwayat Audit",
    icon: Terminal,
    accessibleRoles: ["superadmin", "taskforce", "verifikator", "matching", "pimpinan"],
  },
  {
    id: "rbac",
    label: "Manajemen Peran & Akun",
    icon: Key,
    accessibleRoles: ["superadmin", "taskforce"],
  },
];
