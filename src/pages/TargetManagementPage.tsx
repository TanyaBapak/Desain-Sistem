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
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Manajemen Target</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola proyeksi penempatan berdasarkan periode, sektor, dan jenis jabatan.
        </p>
      </header>
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
