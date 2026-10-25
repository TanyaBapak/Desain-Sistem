import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CountrySectorTargetEditor } from "@/pages/CountrySectorTargetEditor";
import {
  LANDING_KPI_TARGET_FIELDS,
  LandingKpiTargetFields,
} from "@/pages/LandingKpiTargetFields";
import {
  LandingCountryPerformancePreview,
  type LandingCountryPerformance,
} from "@/pages/LandingCountryPerformancePreview";
import { TargetPeriodSelector } from "@/pages/TargetPeriodSelector";

type KpiTargetKey = (typeof LANDING_KPI_TARGET_FIELDS)[number]["key"];
type TargetForm = {
  year: string;
  targets: Record<KpiTargetKey, string> & {
    countrySectors: Record<string, Record<string, string>>;
  };
};

export interface DashboardTargetSettingsProps {
  targets: {
    year: number;
    targets: Record<KpiTargetKey, number | null>;
  }[];
  countries: { id: string; name: string }[];
  sectors: { id: string; name: string }[];
  countryPerformance: LandingCountryPerformance[];
  countrySectorTargets: {
    year: number;
    targets: Record<string, Record<string, number | null>>;
  }[];
  countrySectorPerformance: {
    year: number;
    countryId: string;
    countryName: string;
    sectorId: string;
    sectorName: string;
    target: number;
    achieved: number;
    projected: number;
    percentage: number;
  }[];
}

export function DashboardTargetSettings({
  targets,
  countries,
  sectors,
  countryPerformance,
  countrySectorTargets,
  countrySectorPerformance,
}: DashboardTargetSettingsProps) {
  const currentYear = new Date().getFullYear();
  const targetByYear = new Map(targets.map((target) => [target.year, target.targets]));
  const countrySectorTargetByYear = new Map(
    countrySectorTargets.map((target) => [target.year, target.targets]),
  );
  const availableYears = Array.from(
    new Set([
      currentYear,
      ...targets.map((target) => target.year),
      ...countrySectorTargets.map((target) => target.year),
      ...countryPerformance.map((item) => item.year),
      ...countrySectorPerformance.map((item) => item.year),
    ]),
  ).sort((left, right) => right - left);
  const currentTargets = targetByYear.get(currentYear);
  const kpiTargetValues = Object.fromEntries(
    LANDING_KPI_TARGET_FIELDS.map(({ key }) => [key, currentTargets?.[key]?.toString() ?? ""]),
  ) as Record<KpiTargetKey, string>;
  const form = useForm<TargetForm>({
    year: currentYear.toString(),
    targets: {
      ...kpiTargetValues,
      countrySectors: toFormTargets(countrySectorTargetByYear.get(currentYear) ?? {}),
    },
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    form.transform((data) => ({
      year: Number(data.year),
      targets: {
        ...Object.fromEntries(
          LANDING_KPI_TARGET_FIELDS.map(({ key }) => [key, Number(data.targets[key])]),
        ),
        countrySectors: Object.fromEntries(
          Object.entries(data.targets.countrySectors).map(([countryId, sectorTargets]) => [
            countryId,
            Object.fromEntries(
              Object.entries(sectorTargets).map(([sectorId, value]) => [
                sectorId,
                value === "" ? null : Number(value),
              ]),
            ),
          ]),
        ),
      },
    }));
    form.patch("/admin/dashboard-targets", {
      preserveScroll: true,
      onSuccess: () => toast.success(`Target periode ${form.data.year} berhasil diperbarui.`),
    });
  }

  function changeYear(value: string) {
    form.setData("year", value);
    form.setData("targets", {
      ...Object.fromEntries(
        LANDING_KPI_TARGET_FIELDS.map(({ key }) => [
          key,
          targetByYear.get(Number(value))?.[key]?.toString() ?? "",
        ]),
      ) as Record<KpiTargetKey, string>,
      countrySectors: toFormTargets(countrySectorTargetByYear.get(Number(value)) ?? {}),
    });
  }

  function changeKpiTarget(key: KpiTargetKey, value: string) {
    form.setData("targets", { ...form.data.targets, [key]: value });
  }

  function changeCountrySectorTarget(countryId: string, sectorId: string, value: string) {
    form.setData("targets", {
      ...form.data.targets,
      countrySectors: {
        ...form.data.targets.countrySectors,
        [countryId]: {
          ...form.data.targets.countrySectors[countryId],
          [sectorId]: value,
        },
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pengaturan target landing page</CardTitle>
        <CardDescription>
          Pilih periode, negara, dan sektor untuk menetapkan total target. Capaian dihitung otomatis
          dari demand yang tersimpan dan disetujui.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <TargetPeriodSelector
            year={form.data.year}
            years={availableYears}
            error={form.errors.year}
            onChange={changeYear}
          />
          <div className="grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <LandingKpiTargetFields
              values={form.data.targets}
              errors={form.errors}
              onChange={changeKpiTarget}
            />
          </div>
          <CountrySectorTargetEditor
            year={form.data.year}
            countries={countries}
            sectors={sectors}
            targets={form.data.targets.countrySectors}
            errors={form.errors}
            onTargetChange={changeCountrySectorTarget}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={form.processing}>
              {form.processing ? "Menyimpan…" : `Simpan target ${form.data.year}`}
            </Button>
          </div>
        </form>
      </CardContent>
      <div className="border-t border-border p-4 sm:p-6">
        <LandingCountryPerformancePreview
          performance={countryPerformance}
          sectorPerformance={countrySectorPerformance}
        />
      </div>
    </Card>
  );
}

function toFormTargets(
  targets: Record<string, Record<string, number | null>>,
): Record<string, Record<string, string>> {
  return Object.fromEntries(
    Object.entries(targets).map(([countryId, sectorTargets]) => [
      countryId,
      Object.fromEntries(
        Object.entries(sectorTargets).map(([sectorId, target]) => [
          sectorId,
          target?.toString() ?? "",
        ]),
      ),
    ]),
  );
}
