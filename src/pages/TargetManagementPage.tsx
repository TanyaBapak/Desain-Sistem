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
          Kelola target berdasarkan periode, negara, dan sektor serta pantau capaian aktual.
        </p>
      </header>
      <DashboardTargetSettings
        targets={adminTargets.landingKpiTargets}
        countries={adminTargets.landingCountries}
        sectors={adminTargets.landingSectors}
        countryPerformance={adminTargets.landingCountryPerformance}
        countrySectorTargets={adminTargets.landingCountrySectorTargets}
        countrySectorPerformance={adminTargets.landingCountrySectorPerformance}
      />
    </div>
  );
}
