import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Award } from "lucide-react";
import type { PublicCommandCenterData, PublicCommandCenterStats, TrainingSectorCatalogItem } from "@/types";
import { PublicDrilldownType } from "@/components/landing/PublicDrilldownModal";

// 1. Tipe Drilldown: "peserta"
export function PublicPillarSupply({
  stats,
  data,
  onOpenDrilldown,
}: {
  stats: PublicCommandCenterStats;
  data: PublicCommandCenterData;
  onOpenDrilldown: (type: PublicDrilldownType) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Total Pencari Kerja
          </span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
            {stats.candidatesCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Cakupan nasional</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider block">
            Target Nasional 2026
          </span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">12.600</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Talenta siap latih</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider block">
            Sumber Data
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">Disnaker & LPK</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Kabupaten / Kota</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wider block">
            Drill-down Peserta
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenDrilldown("peserta")}
            className="mt-2 w-full text-xs font-semibold cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Buka Drill-down Peserta
          </Button>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Sebaran Calon Peserta per Provinsi</CardTitle>
            <CardDescription className="text-xs">
              Klik pada provinsi atau tombol drill-down untuk melihat rincian calon siswa per lembaga.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenDrilldown("peserta")}
            className="text-xs text-primary font-semibold"
          >
            Lihat Semua Peserta &rarr;
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data.byProvince || []).map((prov) => {
              const max = Math.max(1, ...(data.byProvince || []).map((p) => p.candidatesCount));
              const pct = Math.round((prov.candidatesCount / max) * 100);
              return (
                <div
                  key={prov.province}
                  onClick={() => onOpenDrilldown("peserta")}
                  className="space-y-1 p-2 rounded-lg hover:bg-muted/40 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-foreground">{prov.province}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {prov.candidatesCount.toLocaleString("id-ID")} Peserta
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.max(pct, 5)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 2. Tipe Drilldown: "program"
export function PublicPillarProgram({
  programsCount,
  trainingSectors,
  sectorOccupations,
  onOpenDrilldown,
  onSelectSector,
}: {
  programsCount: number;
  trainingSectors: TrainingSectorCatalogItem[];
  sectorOccupations: Record<string, string[]>;
  onOpenDrilldown: (type: PublicDrilldownType) => void;
  onSelectSector: (sectorName: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Total Program
          </span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
            {programsCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Silabus kejuruan aktif</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wider block">
            Sektor Industri
          </span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
            {trainingSectors.length}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Bidang keahlian kerja</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider block">
            Standar Kurikulum
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">Global</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">SSW, JIS, BNSP</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wider block">
            Drill-down Program
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenDrilldown("program")}
            className="mt-2 w-full text-xs font-semibold cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Buka Drill-down Program
          </Button>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sektor Kejuruan & Jabatan Kerja</CardTitle>
          <CardDescription className="text-xs">
            Klik sektor di bawah ini untuk melihat daftar jabatan dan lembaga penyelenggara diklat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {trainingSectors.map((sector) => {
              const count = sectorOccupations[sector.name]?.length ?? 0;
              return (
                <button
                  key={sector.name}
                  type="button"
                  onClick={() => {
                    onSelectSector(sector.name);
                    onOpenDrilldown("program");
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-primary/50 transition-all text-left text-xs group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {sector.name}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-muted font-bold text-muted-foreground text-[11px]">
                    {count} Jabatan &rarr;
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
