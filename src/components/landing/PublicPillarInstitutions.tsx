import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";
import type { PublicCommandCenterData, PublicCommandCenterStats } from "@/types";
import { PublicDrilldownType } from "@/components/landing/PublicDrilldownModal";

// 3. Tipe Drilldown: "lembaga" & "sebaran_lembaga"
export function PublicPillarVokasi({
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
            Lembaga Terverifikasi
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {stats.registeredProvidersCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Validasi e-Vokasi</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider block">
            Total Lembaga
          </span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {stats.providersCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Katalog e-Vokasi</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Kepatuhan Verifikasi
          </span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
            {Math.round((stats.registeredProvidersCount / Math.max(1, stats.providersCount)) * 100)}%
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Standar kelayakan bengkel</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider block">
            Drill-down Lembaga
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenDrilldown("lembaga")}
            className="mt-2 w-full text-xs font-semibold cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Buka Direktori Lembaga
          </Button>
        </Card>
      </div>

      {/* Kanal Sumber Pendaftaran Lembaga & Level Penginput */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => onOpenDrilldown("lembaga")}
          className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer transition flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">SISKOP2MI</span>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold border border-blue-500/30">Level: Nasional</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Integrasi Sistem Penempatan BP2MI Pusat</p>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 underline ml-2">Lihat &rarr;</span>
        </div>

        <div
          onClick={() => onOpenDrilldown("lembaga")}
          className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer transition flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Disnaker</span>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/30">Level: Kab/Kota & Prov</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Inputan Disnaker Kab/Kota & Provinsi</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 underline ml-2">Lihat &rarr;</span>
        </div>

        <div
          onClick={() => onOpenDrilldown("lembaga")}
          className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer transition flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Umum / Lembaga</span>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30">Level: Vokasi</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pendaftaran Mandiri SMK / LPK / Balai</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 underline ml-2">Lihat &rarr;</span>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Sebaran Lembaga Vokasi per Provinsi</CardTitle>
            <CardDescription className="text-xs">
              Rasio lembaga terverifikasi e-Vokasi dibandingkan total lembaga di masing-masing provinsi.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenDrilldown("sebaran_lembaga")}
            className="text-xs text-primary font-semibold"
          >
            Buka Sebaran Detail &rarr;
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data.institutionsByProvince || []).map((item) => {
              const pct = Math.round((item.registeredCount / Math.max(1, item.totalCount)) * 100);
              return (
                <div
                  key={item.province}
                  onClick={() => onOpenDrilldown("lembaga")}
                  className="space-y-1 p-2 rounded-lg hover:bg-muted/40 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-foreground">{item.province}</span>
                    <span className="tabular-nums text-xs">
                      <strong className="text-emerald-600 dark:text-emerald-400">{item.registeredCount}</strong> / {item.totalCount} lembaga ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.max(pct, 5)}%` }} />
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

// 4. Tipe Drilldown: "national_lpk"
export function PublicPillarNationalLpk({
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
            Total LPK Nasional
          </span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
            {stats.nationalLpkCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Seluruh 38 provinsi</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider block">
            LPK Terverifikasi RI
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {stats.registeredNationalLpkCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Kesiapan workshop</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider block">
            Cakupan Wilayah
          </span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">38 Provinsi</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Indonesia Sabang - Merauke</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-primary font-medium uppercase tracking-wider block">
            Drill-down Nasional
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenDrilldown("national_lpk")}
            className="mt-2 w-full text-xs font-semibold cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Buka Drill-down LPK
          </Button>
        </Card>
      </div>

      {/* Kanal Sumber Pendaftaran Lembaga & Level Penginput */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => onOpenDrilldown("lembaga")}
          className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer transition flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">SISKOP2MI</span>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold border border-blue-500/30">Level: Nasional</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Integrasi Sistem Penempatan BP2MI Pusat</p>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 underline ml-2">Lihat &rarr;</span>
        </div>

        <div
          onClick={() => onOpenDrilldown("lembaga")}
          className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer transition flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Disnaker</span>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/30">Level: Kab/Kota & Prov</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Inputan Disnaker Kab/Kota & Provinsi</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 underline ml-2">Lihat &rarr;</span>
        </div>

        <div
          onClick={() => onOpenDrilldown("lembaga")}
          className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer transition flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Umum / Lembaga</span>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30">Level: Vokasi</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pendaftaran Mandiri SMK / LPK / Balai</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 underline ml-2">Lihat &rarr;</span>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Sebaran LPK per Provinsi (Nasional)</CardTitle>
            <CardDescription className="text-xs">
              Klik provinsi untuk membuka daftar lembaga vokasi dan calon siswa di provinsi tersebut.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenDrilldown("national_lpk")}
            className="text-xs text-primary font-semibold"
          >
            Buka Modal Nasional &rarr;
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data.nationalLpkByProvince?.length ? data.nationalLpkByProvince : data.institutionsByProvince || []).map((row) => {
              const pct = Math.round((row.registeredCount / Math.max(1, row.totalCount)) * 100);
              return (
                <div
                  key={row.province}
                  onClick={() => onOpenDrilldown("national_lpk")}
                  className="space-y-1 p-2 rounded-lg hover:bg-muted/40 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-foreground">{row.province}</span>
                    <span className="tabular-nums text-xs">
                      <strong className="text-emerald-600 dark:text-emerald-400">{row.registeredCount}</strong> / {row.totalCount} lembaga ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.max(pct, 5)}%` }} />
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
