import React from "react";
import type {
  PublicCommandCenterData,
  PublicCommandCenterStats,
  TrainingSectorCatalogItem,
} from "@/types";
import { PublicDrilldownType } from "@/components/landing/PublicDrilldownModal";
import { PublicPillarOverview } from "@/components/landing/PublicPillarOverview";
import {
  PublicPillarSupply,
  PublicPillarProgram,
} from "@/components/landing/PublicPillarSupplyAndProgram";
import {
  PublicPillarVokasi,
  PublicPillarNationalLpk,
} from "@/components/landing/PublicPillarInstitutions";
import {
  PublicPillarDemand,
  PublicPillarAlokasi,
} from "@/components/landing/PublicPillarDemandAndAllocation";

export type PublicCCTab =
  | "ringkasan"
  | "peserta"
  | "program"
  | "lembaga"
  | "national_lpk"
  | "demand"
  | "alokasi";

interface PublicCommandCenterPillarsProps {
  activeTab: PublicCCTab;
  stats: PublicCommandCenterStats;
  data: PublicCommandCenterData;
  programsCount: number;
  sectorOccupations: Record<string, string[]>;
  trainingSectors: TrainingSectorCatalogItem[];
  onSelectTab: (tab: PublicCCTab) => void;
  onOpenDrilldown: (type: PublicDrilldownType) => void;
  onSelectSector: (sectorName: string) => void;
}

export function PublicCommandCenterPillars({
  activeTab,
  stats,
  data,
  programsCount,
  sectorOccupations,
  trainingSectors,
  onSelectTab,
  onOpenDrilldown,
  onSelectSector,
}: PublicCommandCenterPillarsProps) {
  switch (activeTab) {
    case "peserta":
      return (
        <PublicPillarSupply
          stats={stats}
          data={data}
          onOpenDrilldown={onOpenDrilldown}
        />
      );

    case "program":
      return (
        <PublicPillarProgram
          programsCount={programsCount}
          trainingSectors={trainingSectors}
          sectorOccupations={sectorOccupations}
          onOpenDrilldown={onOpenDrilldown}
          onSelectSector={onSelectSector}
        />
      );

    case "lembaga":
      return (
        <PublicPillarVokasi
          stats={stats}
          data={data}
          onOpenDrilldown={onOpenDrilldown}
        />
      );

    case "national_lpk":
      return (
        <PublicPillarNationalLpk
          stats={stats}
          data={data}
          onOpenDrilldown={onOpenDrilldown}
        />
      );

    case "demand":
      return (
        <PublicPillarDemand
          stats={stats}
          onOpenDrilldown={onOpenDrilldown}
        />
      );

    case "alokasi":
      return (
        <PublicPillarAlokasi
          stats={stats}
          onOpenDrilldown={onOpenDrilldown}
        />
      );

    default:
      return (
        <PublicPillarOverview
          stats={stats}
          programsCount={programsCount}
          sectorsCount={trainingSectors.length}
          onSelectTab={onSelectTab}
          onOpenDrilldown={onOpenDrilldown}
        />
      );
  }
}
