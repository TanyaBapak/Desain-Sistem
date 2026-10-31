import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe2, Layers, Workflow } from "lucide-react";
import type { PublicCommandCenterStats } from "@/types";
import { PublicDrilldownType } from "@/components/landing/PublicDrilldownModal";

// 5. Tipe Drilldown: "demand"
export function PublicPillarDemand({
  stats,
  onOpenDrilldown,
}: {
  stats: PublicCommandCenterStats;
  onOpenDrilldown: (type: PublicDrilldownType) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Permintaan Terbuka
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {stats.demandsCount.toLocaleString("id-ID")} Paket
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Lowongan kerja resmi</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Negara Mitra
          </span>
          <div className="text-2xl font-bold text-foreground mt-1">4 Negara</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Turki, Jepang, Malaysia, Korea</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider block">
            Otoritas Rujukan
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">SISKOP2MI</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">BP2MI Terintegrasi</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider block">
            Drill-down Demand
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenDrilldown("demand")}
            className="mt-2 w-full text-xs font-semibold cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Buka Rincian Demand
          </Button>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Permintaan Tenaga Kerja Luar Negeri</CardTitle>
            <CardDescription className="text-xs">
              Klik pada negara untuk melihat rincian perusahaan mitra, jabatan, dan kuota.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenDrilldown("demand")}
            className="text-xs text-primary font-semibold"
          >
            Lihat Semua Lowongan &rarr;
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: "Jepang (SSW Kaigo & Welder)", quota: "120 slot" },
              { name: "Jerman (Ausbildung)", quota: "80 slot" },
              { name: "Korea Selatan (E-7 / E-9)", quota: "150 slot" },
              { name: "Turki (Hospitality Staff)", quota: "60 slot" },
            ].map((country) => (
              <div
                key={country.name}
                onClick={() => onOpenDrilldown("demand")}
                className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-amber-500/50 transition cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Globe2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">{country.name}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 font-semibold">✓ Terverifikasi</span>
                  <span className="font-bold text-foreground tabular-nums">{country.quota}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 6. Tipe Drilldown: "alokasi"
export function PublicPillarAlokasi({
  stats,
  onOpenDrilldown,
}: {
  stats: PublicCommandCenterStats;
  onOpenDrilldown: (type: PublicDrilldownType) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Batch Teralokasi
          </span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
            {stats.allocationsCount} Batch
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">SK kuota penetapan</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wider block">
            Tahapan Saat Ini
          </span>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">Tahap 4</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Matching & Alokasi Kursi</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider block">
            Status Validasi
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">Siap Berangkat</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Batch 2027</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wider block">
            Drill-down Alokasi
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenDrilldown("alokasi")}
            className="mt-2 w-full text-xs font-semibold cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Buka Status Alokasi
          </Button>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Tahapan Alokasi Penempatan Batch & Tracking</CardTitle>
            <CardDescription className="text-xs">
              Proses penetapan kuota peserta dari balai vokasi ke lowongan kerja internasional.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenDrilldown("alokasi")}
            className="text-xs text-primary font-semibold"
          >
            Lihat Rincian Alokasi &rarr;
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { stage: "Penetapan SK Kuota Batch I 2027", status: "Selesai", desc: "SK alokasi 1.920 kursi pelatihan disahkan Direktorat PKV PMI" },
              { stage: "Pencocokan Peserta dengan Pemberi Kerja", status: "Sedang Berjalan", desc: "Simulasi algoritmik kualifikasi bahasa & sertifikasi teknis" },
              { stage: "Verifikasi Visa & Kontrak Kerja Luar Negeri", status: "Tahap Lanjutan", desc: "Sinkronisasi E-KTKLN via SISKOP2MI" },
            ].map((item, idx) => (
              <div
                key={item.stage}
                onClick={() => onOpenDrilldown("alokasi")}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/40 cursor-pointer transition"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>{item.stage}</span>
                    <span className="text-[11px] text-emerald-600 font-semibold">{item.status}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
