import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Globe2, GraduationCap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROGRAM_TRAINING_SECTORS } from "@/lib/constants/program-training-sectors";
import type { PublicCommandCenterData } from "@/types";
import {
  PublicDrilldownModal,
  PublicDrilldownType,
} from "@/components/landing/PublicDrilldownModal";

interface PublicCommandCenterSectionProps {
  initialData?: PublicCommandCenterData;
  programsCount: number;
  sectorOccupations: Record<string, string[]>;
}

export const PublicCommandCenterSection: React.FC<PublicCommandCenterSectionProps> = ({
  initialData,
  programsCount,
  sectorOccupations,
}) => {
  const [activeDrilldown, setActiveDrilldown] = useState<PublicDrilldownType | null>(null);
  const [activeProgramSector, setActiveProgramSector] = useState<string | null>(null);

  const scopeLabel = "Nasional (Seluruh RI)";

  const currentStats = useMemo(() => {
    return {
      scopeName: scopeLabel,
      candidatesCount: initialData?.national?.candidatesCount ?? 12600,
      programsCount: initialData?.national?.programsCount ?? 3998,
      providersCount: initialData?.national?.providersCount ?? 2382,
      registeredProvidersCount: initialData?.national?.registeredProvidersCount ?? 24,
      nationalLpkCount: initialData?.national?.nationalLpkCount ?? 2382,
      registeredNationalLpkCount: initialData?.national?.registeredNationalLpkCount ?? 2,
      demandsCount: initialData?.national?.demandsCount ?? 4,
      allocationsCount: initialData?.national?.allocationsCount ?? 2,
    };
  }, [initialData]);

  const synthesizedData: PublicCommandCenterData = useMemo(() => {
    const fallbackData: PublicCommandCenterData = {
      selectedProvince: "all",
      provinces: [],
      national: currentStats,
      activeStats: currentStats,
      byProvince: [
        { province: "Jawa Tengah", candidatesCount: 155, programsCount: 3998, providersCount: 965, registeredProvidersCount: 8, lpkCount: 965, registeredLpkCount: 8 },
        { province: "Jawa Barat", candidatesCount: 850, programsCount: 650, providersCount: 620, registeredProvidersCount: 6, lpkCount: 620, registeredLpkCount: 6 },
        { province: "Jawa Timur", candidatesCount: 620, programsCount: 480, providersCount: 410, registeredProvidersCount: 4, lpkCount: 410, registeredLpkCount: 4 },
      ],
      institutionsByProvince: [
        { province: "Jawa Tengah", totalCount: 965, registeredCount: 8 },
        { province: "Jawa Barat", totalCount: 620, registeredCount: 6 },
        { province: "Jawa Timur", totalCount: 410, registeredCount: 4 },
      ],
      nationalLpkByProvince: [
        { province: "Jawa Tengah", totalCount: 2381, registeredCount: 2 },
        { province: "Jawa Barat", totalCount: 620, registeredCount: 6 },
      ],
    };
    return {
      ...(initialData ?? fallbackData),
      selectedProvince: "all",
      activeStats: currentStats,
    };
  }, [initialData, currentStats]);

  return (
    <section
      id="dashboard-command-center"
      className="border-b border-border bg-slate-50/70 dark:bg-slate-950/40 py-10 sm:py-12"
      aria-labelledby="command-center-heading"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="command-center-heading"
                className="text-2xl font-bold tracking-tight text-foreground"
              >
                Dashboard Command Center
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                Publik
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Selamat datang di Portal Publik Task Force SMK Go Global. Lingkup:{" "}
              <strong className="text-foreground">{scopeLabel}</strong>
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
          {/* 1. Calon Peserta */}
          <CommandStatCard
            label="Calon Peserta"
            value={currentStats.candidatesCount}
            desc="Seluruh peserta pada cakupan nasional"
            icon={Users}
            onClick={() => setActiveDrilldown("lembaga")}
          />

          {/* 2. Program Pelatihan */}
          <CommandStatCard
            label="Program Pelatihan"
            value={programsCount}
            desc="Program pada negara tujuan yang ditampilkan"
            icon={GraduationCap}
            onClick={() => setActiveDrilldown("program")}
          />

          <Card className="min-w-0">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Program Pelatihan per Sektor
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pilih sektor untuk melihat jabatan dan lembaga vokasi
                  </CardDescription>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 px-3 pb-3 pt-1">
              {PROGRAM_TRAINING_SECTORS.map((sector) => (
                <button
                  key={sector.name}
                  type="button"
                  onClick={() => {
                    setActiveProgramSector(sector.name);
                    setActiveDrilldown("program");
                  }}
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Lihat ${sectorOccupations[sector.name]?.length ?? 0} jabatan sektor ${sector.name}`}
                >
                  <span className="min-w-0 truncate font-medium">{sector.name}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-semibold tabular-nums text-muted-foreground">
                    {sectorOccupations[sector.name]?.length ?? 0}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Lembaga Vokasi */}
          <CommandStatCard
            label="Lembaga Vokasi"
            value={currentStats.registeredProvidersCount}
            badge="Terverifikasi"
            desc="Lembaga terverifikasi e-Vokasi"
            icon={Building2}
            onClick={() => setActiveDrilldown("lembaga")}
          />

          {/* 4. Lembaga Terdaftar Nasional */}
          <CommandStatCard
            label="Lembaga Terdaftar Nasional"
            value={currentStats.registeredNationalLpkCount}
            badge="Terverifikasi"
            desc="Lembaga terverifikasi di seluruh Indonesia"
            icon={Building2}
            onClick={() => setActiveDrilldown("national_lpk")}
          />

          {/* 5. Permintaan Luar Negeri */}
          <CommandStatCard
            label="Permintaan Luar Negeri"
            value={currentStats.demandsCount}
            desc="Lowongan kerja LN"
            icon={Globe2}
            onClick={() => setActiveDrilldown("demand")}
          />

        </div>
      </div>

      {/* Drilldown Modal for Public */}
      <PublicDrilldownModal
        type={activeDrilldown}
        onClose={() => {
          setActiveDrilldown(null);
          setActiveProgramSector(null);
        }}
        scopeName={scopeLabel}
        data={synthesizedData}
        initialSector={activeProgramSector}
        sectorOccupations={sectorOccupations}
      />
    </section>
  );
};

interface CommandStatCardProps {
  label: string;
  value: number;
  desc: string;
  badge?: string;
  icon: React.ElementType;
  onClick?: () => void;
  children?: React.ReactNode;
}

function CommandStatCard({
  label,
  value,
  desc,
  badge,
  icon: Icon,
  onClick,
  children,
}: CommandStatCardProps) {
  return (
    <Card
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "transition-all duration-200 select-none",
        onClick &&
          "cursor-pointer hover:border-primary/60 hover:shadow-md hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <div>
          <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {label}
          </CardTitle>
          <CardDescription className="text-xs">{desc}</CardDescription>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl font-bold tabular-nums text-foreground">
            {value.toLocaleString("id-ID")}
          </div>
          {badge && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 tabular-nums shrink-0">
              {badge}
            </span>
          )}
        </div>
        {children}
        {onClick && (
          <p className="mt-2 text-[11px] font-medium text-primary flex items-center gap-1 group-hover:underline">
            Klik untuk melihat detail &rarr;
          </p>
        )}
      </CardContent>
    </Card>
  );
}
