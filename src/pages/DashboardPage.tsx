"use client";

import * as React from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  Compass,
  Users,
  GraduationCap,
  Building2,
  Globe2,
  Workflow,
  CheckCircle2,
  Monitor,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { STAKEHOLDER_ROLES } from "@/lib/stakeholder-roles";

const TAHAP_DATA = [
  {
    id: 1,
    title: "Pengumpulan Data",
    subtitle: "Disnaker · BP3MI · LPK · Demand",
    icon: Users,
    status: "Selesai",
    progress: 100,
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    badge: "Data terkumpul",
  },
  {
    id: 2,
    title: "Validasi & Standardisasi",
    subtitle: "Deduplikasi · Verifikasi lembaga · Klasifikasi sektor",
    icon: CheckCircle2,
    status: "Sedang Berjalan",
    progress: 75,
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
    badge: "Proses verifikasi",
  },
  {
    id: 3,
    title: "Analisis Gap & Matching",
    subtitle: "Demand vs Supply · Kompetensi · Kapasitas",
    icon: Workflow,
    status: "Sedang Berjalan",
    progress: 60,
    color: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
    badge: "Matching engine",
  },
  {
    id: 4,
    title: "Penetapan Program & Lembaga",
    subtitle: "Kuota · Wilayah · Penyelenggara · Peserta · Anggaran",
    icon: Building2,
    status: "Menunggu",
    progress: 30,
    color: "bg-amber-500/10 text-amber-700 border-amber-200",
    badge: "SIPPMI Monitoring",
    source: "sippmi",
  },
  {
    id: 5,
    title: "Pelaksanaan & Monitoring",
    subtitle: "Kebukaan kelas · Kehadiran · JP · Asesmen · Sertifikasi",
    icon: Clock,
    status: "Menunggu",
    progress: 15,
    color: "bg-rose-500/10 text-rose-700 border-rose-200",
    badge: "SIPPMI Monitoring",
    source: "sippmi",
  },
  {
    id: 6,
    title: "Job Matching & Penempatan",
    subtitle: "Seleksi employer · Persyaratan · Pen via sistem berwenang",
    icon: ArrowRight,
    status: "Menunggu",
    progress: 5,
    color: "bg-violet-500/10 text-violet-700 border-violet-200",
    badge: "SIPPMI Monitoring",
    source: "sippmi",
  },
];

interface DashboardPageProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  const { candidates, providers, demands, allocations, currentUser, currentRole, currentScope } =
    useAppStore();
  const { toast } = useToast();

  const roleObj = getRoleInfo(currentRole);
  const stakeholder = STAKEHOLDER_ROLES.find((r) => r.id === currentRole);

  const pendingApprovals = 0; // computed from store in real impl

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Selamat datang, <strong>{currentUser?.name}</strong> ({roleObj?.title}). Lingkup:{" "}
            <span className="font-medium">{currentScope?.name}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              toast("Data direstapkan", {
                description: "Semua dataset kembali ke nilai sampel default.",
              });
            }}
            variant="outline"
            size="sm"
          >
            Reset Data
          </Button>
        </div>
      </div>
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Calon Peserta"
          value={candidates.length}
          icon={Users}
          desc="Data supply terverifikasi"
        />
        <StatCard
          label="Program Pelatihan"
          value={5}
          icon={GraduationCap}
          desc="Katalog program aktif"
        />
        <StatCard
          label="Lembaga Vokasi (LPK)"
          value={providers.length}
          icon={Building2}
          desc="Mitra penyelenggara"
        />
        <StatCard
          label="Demand Luar Negeri"
          value={demands.length}
          icon={Globe2}
          desc="Lowongan kerja LN"
        />
        <StatCard
          label="Alokasi Penempatan"
          value={allocations.length}
          icon={Workflow}
          desc="Batch sudah dialokasi"
        />
      </div>

      {/* Role context info */}
      {stakeholder && (
        <Card className="border-l-4 border-blue-500 bg-blue-50">
          <CardHeader className="flex flex-row items-center gap-3 p-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: stakeholder.color === "bg-blue-500" ? "#3b82f6" : stakeholder.color === "bg-indigo-500" ? "#6366f1" : stakeholder.color === "bg-violet-500" ? "#a855f7" : stakeholder.color === "bg-emerald-500" ? "#10b981" : stakeholder.color === "bg-slate-500" ? "#64748b" : stakeholder.color === "bg-cyan-500" ? "#06b6d4" : stakeholder.color === "bg-amber-500" ? "#f59e0b" : stakeholder.color === "bg-rose-500" ? "#f43f5e" : "#3b82f6" }}>
              {stakeholder.name.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-sm font-bold">{stakeholder.name}</CardTitle>
              <CardDescription className="text-xs">{stakeholder.responsibility}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span><span className="font-semibold text-slate-900">Scope:</span> {stakeholder.scope}</span>
              <span><span className="font-semibold text-slate-900">Grup:</span> {stakeholder.group}</span>
              <Badge variant="outline">Hak akses: {getRoleInfo(currentRole).accessibleModules.length} modul</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tahap 1-6 */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TAHAP_DATA.map((tahap) => (
          <TahapCard key={tahap.id} tahap={tahap} />
        ))}
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Input Calon Peserta (Modul A)"
          desc="Disnaker / LPK input data pencari kerja"
          icon={Users}
          onClick={() => setCurrentTab("modul-a")}
        />
        <QuickActionCard
          title="Kelola Program (Modul B)"
          desc="Direktorat menetapkan kurikulum & kuota"
          icon={GraduationCap}
          onClick={() => setCurrentTab("modul-b")}
        />
        <QuickActionCard
          title="Monitoring SIPPMI (T4-6)"
          desc="Batch, kehadiran, JP, sertifikasi & penempatan"
          icon={Monitor}
          onClick={() => setCurrentTab("sippmi-monitoring")}
        />
      </section>
    </div>
  );
};

function StatCard({ label, value, icon: Icon, desc }: { label: string; value: number; icon: React.ElementType; desc: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">{label}</CardTitle>
          <CardDescription className="text-xs">{desc}</CardDescription>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500" style={{ backgroundColor: "rgba(59,130,246,0.1)" }}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function TahapCard({ tahap }: { tahap: (typeof TAHAP_DATA)[number] }) {
  const isSippmi = tahap.source === "sippmi";
  return (
    <Card className={cn("overflow-hidden", isSippmi ? "border-l-2 border-amber-500 bg-amber-50" : "")}>
      <CardHeader className="p-4 pb-3 flex flex-row items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tahap.color}`}>
            <tahap.icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">{tahap.title}</CardTitle>
            <CardDescription className="text-xs">{tahap.subtitle}</CardDescription>
          </div>
        </div>
        <Badge variant={isSippmi ? "outline" : "secondary"} className="text-[10px]">
          {tahap.badge}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">{tahap.status}</span>
          <span className="text-xs font-mono text-muted-foreground">{tahap.progress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full transition-all duration-500 ${tahap.color.replace("/10", "").replace("text-", "bg-")}`} style={{ width: `${tahap.progress}%` }} />
        </div>
        {isSippmi && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            <span>Data dari SIPPMI (LPK)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ title, desc, icon: Icon, onClick }: { title: string; desc: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <Card onClick={onClick} className="cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition">
      <CardHeader className="p-4 pb-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-blue-500" style={{ backgroundColor: "rgba(59,130,246,0.1)" }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-sm font-bold">{title}</CardTitle>
          <CardDescription className="text-xs">{desc}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

function getRoleInfo(role: string) {
  const mockRoles: Record<string, { title: string; accessibleModules: string[] }> = {
    superadmin: { title: "Super Admin / Pusdatin", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "audit", "rbac"] },
    pimpinan: { title: "Menteri / Pimpinan", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "audit", "rbac"] },
    taskforce: { title: "Admin Task Force Nasional", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "audit", "rbac"] },
    disnaker: { title: "Admin Disnaker Kab/Kota", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "rbac"] },
    vokasi: { title: "Admin Lembaga Vokasi", accessibleModules: ["overview", "modul-c", "modul-b", "modul-a", "modul-d", "matching", "approvals", "rbac"] },
    demand: { title: "Admin Demand / Pemberi Kerja", accessibleModules: ["overview", "modul-d", "matching", "approvals", "rbac"] },
    verifikator: { title: "Verifikator Data & Dokumen", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "audit", "rbac"] },
    matching: { title: "Admin Matching & Penempatan", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "audit", "rbac"] },
    bp3mi: { title: "Admin BP3MI", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "audit", "rbac"] },
    direktorat: { title: "Direktorat PKV PMI", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "audit", "rbac"] },
  };
  return mockRoles[role] || mockRoles.superadmin;
}
