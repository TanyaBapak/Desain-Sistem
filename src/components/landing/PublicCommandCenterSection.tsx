import React, { useMemo, useState } from "react";
import {
  Sparkles,
} from "lucide-react";
import type { PublicCommandCenterData, TrainingSectorCatalogItem } from "@/types";
import {
  PublicDrilldownModal,
  PublicDrilldownType,
} from "@/components/landing/PublicDrilldownModal";
import { CascadingFlyout } from "@/components/shared/CascadingFlyout";
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
      candidatesByCountry: initialData?.national?.candidatesByCountry,
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

  React.useEffect(() => {
    const handleCustomDrilldown = (e: Event) => {
      const customEvent = e as CustomEvent<PublicDrilldownType>;
      if (customEvent.detail) {
        setActiveDrilldown(customEvent.detail);
      }
    };
    window.addEventListener("p2mi:open-drilldown", handleCustomDrilldown);
    return () => window.removeEventListener("p2mi:open-drilldown", handleCustomDrilldown);
  }, []);

  if (!activeDrilldown) {
    return null;
  }

  return (
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
  );
};
