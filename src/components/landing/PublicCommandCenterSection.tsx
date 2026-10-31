import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Info,
} from "lucide-react";
import type { PublicCommandCenterData, TrainingSectorCatalogItem } from "@/types";
import {
  PublicDrilldownModal,
  PublicDrilldownType,
} from "@/components/landing/PublicDrilldownModal";
import { CascadingFlyout } from "@/components/shared/CascadingFlyout";
import { PillarTimelineFlow } from "@/components/shared/PillarTimelineFlow";
import { PillarKey } from "@/components/shared/CascadingFlyoutData";

interface PublicCommandCenterSectionProps {
  initialData?: PublicCommandCenterData;
  programsCount: number;
  sectorOccupations: Record<string, string[]>;
  trainingSectors: TrainingSectorCatalogItem[];
}

export const PublicCommandCenterSection: React.FC<PublicCommandCenterSectionProps> = ({
  initialData,
  programsCount,
  sectorOccupations,
  trainingSectors,
}) => {
  const [activeDrilldown, setActiveDrilldown] = useState<PublicDrilldownType | null>(null);
  const [activeProgramSector, setActiveProgramSector] = useState<string | null>(null);
  const [activeSourceFilter, setActiveSourceFilter] = useState<"ALL" | "siskop2mi" | "disnaker" | "umum">("ALL");

  const scopeLabel = "Nasional (Seluruh RI)";

  const currentStats = useMemo(() => {
    return {
      scopeName: scopeLabel,
      candidatesCount: initialData?.national?.candidatesCount ?? 12600,
      programsCount: initialData?.national?.programsCount ?? 630,
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

  const handleOpenDrilldownFromFlyout = (pillar: PillarKey) => {
    const map: Record<PillarKey, PublicDrilldownType> = {
      sup: "peserta",
      pel: "program",
      lpk: "lembaga",
      dem: "demand",
    };
    setActiveDrilldown(map[pillar]);
  };

  const handleTimelineStageSelect = (stageId: string) => {
    const stageMap: Record<string, PublicDrilldownType> = {
      supply: "peserta",
      pelatihan: "program",
      vokasi: "lembaga",
      demand: "demand",
      penempatan: "alokasi",
    };
    if (stageMap[stageId]) {
      setActiveDrilldown(stageMap[stageId]);
    }
  };

  return (
    <section
      id="dashboard-command-center"
      className="border-b border-border bg-slate-50 dark:bg-slate-950 py-10 sm:py-12"
      aria-labelledby="command-center-heading"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="command-center-heading"
                className="text-2xl font-bold tracking-tight text-foreground"
              >
                Dashboard Command Center
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                Publik
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Selamat datang di Portal Publik Task Force SMK Go Global. Lingkup:{" "}
              <strong className="text-foreground">{scopeLabel}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-3 py-1 rounded-md bg-card border border-border font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Satu Data · Satu Pemantauan · Satu Keputusan</span>
            </span>
          </div>
        </div>

        {/* Animated Pipeline / Timeline Flow (Supply -> Demand -> Penempatan) */}
        <PillarTimelineFlow
          onOpenFull={handleTimelineStageSelect}
          onSelectStage={handleTimelineStageSelect}
        />

        {/* Guidance Instruction and Prototype Note */}
        <div className="space-y-2">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Klik card untuk membuka data · klik item baris untuk menelusuri tingkat berikutnya secara bertahap
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2 text-xs text-primary font-medium">
            <Info className="h-4 w-4 shrink-0" />
            <span>Prototipe terintegrasi dengan data riil & drill-down bertingkat (Cascading Flyout).</span>
          </div>
        </div>

        {/* 1. Cascading Flyout 4 Pillars Component */}
        <CascadingFlyout onOpenDrilldownModal={handleOpenDrilldownFromFlyout} />

        {/* Bagian Kanal Asal / Sumber Pendaftaran & Kesenjangan Supply vs Demand di-hidden sesuai permintaan */}
      </div>

      {/* Drilldown Modal for Public */}
      {activeDrilldown && (
        <PublicDrilldownModal
          type={activeDrilldown}
          onClose={() => {
            setActiveDrilldown(null);
            setActiveProgramSector(null);
            setActiveSourceFilter("ALL");
          }}
          scopeName={scopeLabel}
          data={synthesizedData}
          initialSector={activeProgramSector}
          initialSourceFilter={activeSourceFilter}
          sectorOccupations={sectorOccupations}
          trainingSectors={trainingSectors}
        />
      )}
    </section>
  );
};
