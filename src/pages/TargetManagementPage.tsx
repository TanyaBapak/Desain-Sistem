import { router } from "@inertiajs/react";
import { Calendar, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardTargetSettings } from "@/pages/DashboardTargetSettings";
import { TrainingReferenceDataManager } from "@/pages/TrainingReferenceDataManager";
import type { DashboardTargetManagementData } from "@/pages/user-management-types";

interface TargetManagementPageProps {
  adminTargets?: DashboardTargetManagementData;
}

export function TargetManagementPage({ adminTargets }: TargetManagementPageProps) {
  if (!adminTargets) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Data target tidak dapat dimuat. Muat ulang halaman atau hubungi administrator.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manajemen Target</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola proyeksi penempatan berdasarkan periode, sektor, dan jenis jabatan.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => router.visit("/app/modul-b")}
          className="inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Calendar className="h-4 w-4" />
          <span>Atur Tanggal Sektor Pelatihan</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </header>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Jadwal & Tanggal Pelaksanaan Pelatihan per Sektor (JP)
              </h2>
              <p className="text-xs text-muted-foreground">
                Atur Tanggal Mulai dan Tanggal Selesai secara serentak per sektor pelatihan melalui menu Program Pelatihan.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.visit("/app/modul-b")}
            className="shrink-0 gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Buka Jadwal Sektor</span>
          </Button>
        </CardContent>
      </Card>

      <DashboardTargetSettings
        countries={adminTargets.landingCountries}
        projectionCountryOptions={adminTargets.landingProjectionCountryOptions}
        projectionCountries={adminTargets.landingProjectionCountries}
        targets={adminTargets.landingKpiTargets}
        placementOptions={adminTargets.landingPlacementOptions}
        placementTargets={adminTargets.landingPlacementTargets}
      />
      <TrainingReferenceDataManager
        sectors={adminTargets.trainingSectors}
        occupations={adminTargets.trainingOccupations}
      />
    </div>
  );
}
