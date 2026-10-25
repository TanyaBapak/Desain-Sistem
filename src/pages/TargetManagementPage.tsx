import { DashboardTargetSettings } from "@/pages/DashboardTargetSettings";
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
          Kelola target landing page berdasarkan periode tahunan dan pantau capaian aktual setiap
          negara tujuan.
        </p>
      </header>
      <DashboardTargetSettings
        targets={adminTargets.landingKpiTargets}
        countries={adminTargets.landingCountries}
        countryTargets={adminTargets.landingCountryTargets}
        countryPerformance={adminTargets.landingCountryPerformance}
        countryTrainingTargets={adminTargets.landingCountryTrainingTargets}
        countryTrainingPerformance={adminTargets.landingCountryTrainingPerformance}
      />
    </div>
  );
}
