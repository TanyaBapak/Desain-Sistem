import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  COUNTRY_TRAINING_TARGET_TYPES,
  CountryTrainingTargetEditor,
} from "@/pages/CountryTrainingTargetEditor";
import {
  LANDING_KPI_TARGET_FIELDS,
  LandingKpiTargetFields,
} from "@/pages/LandingKpiTargetFields";
import {
  LandingCountryPerformancePreview,
  type LandingCountryPerformance,
} from "@/pages/LandingCountryPerformancePreview";
import { TargetPeriodSelector } from "@/pages/TargetPeriodSelector";

export interface DashboardTargetSettingsProps {
  targets: {
    year: number;
    targets: {
      registeredJobSeekers: number | null;
      readyForPlacement: number | null;
      activeTrainingPrograms: number | null;
      activeVocationalInstitutions: number | null;
      nationalLpkCount: number | null;
      validatedDemandCount: number | null;
    };
  }[];
  countries: { id: string; name: string }[];
  countryTargets: {
    year: number;
    targets: Record<string, number | null>;
  }[];
  countryPerformance: LandingCountryPerformance[];
  countryTrainingTargets: {
    year: number;
    targets: Record<string, Record<string, number | null>>;
  }[];
  countryTrainingPerformance: {
    year: number;
    countryId: string;
    countryName: string;
    trainingType: string;
    trainingTypeKey: string;
    target: number;
    achieved: number;
    projected: number;
    percentage: number;
  }[];
}

export function DashboardTargetSettings({
  targets,
  countries,
  countryTargets,
  countryPerformance,
  countryTrainingTargets,
  countryTrainingPerformance,
}: DashboardTargetSettingsProps) {
  const currentYear = new Date().getFullYear();
  const targetByYear = new Map(targets.map((target) => [target.year, target.targets]));
  const countryTargetByYear = new Map(countryTargets.map((target) => [target.year, target.targets]));
  const countryTrainingTargetByYear = new Map(
    countryTrainingTargets.map((target) => [target.year, target.targets]),
  );
  const availableYears = Array.from(
    new Set([
      currentYear,
      ...targets.map((target) => target.year),
      ...countryTargets.map((target) => target.year),
      ...countryTrainingTargets.map((target) => target.year),
      ...countryPerformance.map((item) => item.year),
      ...countryTrainingPerformance.map((item) => item.year),
    ]),
  ).sort((left, right) => right - left);
  const currentTargets = targetByYear.get(currentYear);
  const currentCountryTargets = countryTargetByYear.get(currentYear);
  const currentCountryTrainingTargets = countryTrainingTargetByYear.get(currentYear);
  const kpiTargetValues = Object.fromEntries(
    LANDING_KPI_TARGET_FIELDS.map(({ key }) => [key, currentTargets?.[key]?.toString() ?? ""]),
  ) as Record<(typeof LANDING_KPI_TARGET_FIELDS)[number]["key"], string>;
  const form = useForm({
    year: currentYear.toString(),
    targets: {
      ...kpiTargetValues,
      countries: Object.fromEntries(
        countries.map(({ id }) => [id, currentCountryTargets?.[id]?.toString() ?? ""]),
      ),
      countryTrainingTypes: Object.fromEntries(
        countries.map(({ id }) => [
          id,
          Object.fromEntries(
            COUNTRY_TRAINING_TARGET_TYPES.map(({ key }) => [
              key,
              currentCountryTrainingTargets?.[id]?.[key]?.toString() ?? "",
            ]),
          ),
        ]),
      ),
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
        countries: Object.fromEntries(
          countries.map(({ id }) => [
            id,
            data.targets.countries[id] === "" ? null : Number(data.targets.countries[id]),
          ]),
        ),
        countryTrainingTypes: Object.fromEntries(
          countries.map(({ id }) => [
            id,
            Object.fromEntries(
              COUNTRY_TRAINING_TARGET_TYPES.map(({ key }) => [
                key,
                data.targets.countryTrainingTypes[id][key] === ""
                  ? null
                  : Number(data.targets.countryTrainingTypes[id][key]),
              ]),
            ),
          ]),
        ),
      },
    }));
    form.patch("/admin/dashboard-targets", {
      preserveScroll: true,
      onSuccess: () => toast.success(`Target KPI, negara, dan jenis pelatihan tahun ${form.data.year} berhasil diperbarui.`),
    });
  }

  function changeYear(value: string) {
    form.setData("year", value);
    form.setData("targets", {
      ...form.data.targets,
      ...Object.fromEntries(
        LANDING_KPI_TARGET_FIELDS.map(({ key }) => [
          key,
          targetByYear.get(Number(value))?.[key]?.toString() ?? "",
        ]),
      ),
      countries: Object.fromEntries(
        countries.map(({ id }) => [
          id,
          countryTargetByYear.get(Number(value))?.[id]?.toString() ?? "",
        ]),
      ),
      countryTrainingTypes: Object.fromEntries(
        countries.map(({ id }) => [
          id,
          Object.fromEntries(
            COUNTRY_TRAINING_TARGET_TYPES.map(({ key }) => [
              key,
              countryTrainingTargetByYear.get(Number(value))?.[id]?.[key]?.toString() ?? "",
            ]),
          ),
        ]),
      ),
    });
  }

  function changeKpiTarget(
    key: (typeof LANDING_KPI_TARGET_FIELDS)[number]["key"],
    value: string,
  ) {
    form.setData("targets", { ...form.data.targets, [key]: value });
  }

  function changeCountryTarget(countryId: string, value: string) {
    form.setData("targets", {
      ...form.data.targets,
      countries: { ...form.data.targets.countries, [countryId]: value },
    });
  }

  function changeCountryTrainingTarget(countryId: string, typeKey: string, value: string) {
    form.setData("targets", {
      ...form.data.targets,
      countryTrainingTypes: {
        ...form.data.targets.countryTrainingTypes,
        [countryId]: {
          ...form.data.targets.countryTrainingTypes[countryId],
          [typeKey]: value,
        },
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Target tahunan halaman depan</CardTitle>
        <CardDescription>
          Atur target keenam indikator untuk setiap tahun. Halaman depan menampilkan capaian aktual
          dibanding target tahun berjalan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-4">
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
          </div>
          <CountryTrainingTargetEditor
            countries={countries}
            countryTargets={form.data.targets.countries}
            countryTrainingTargets={form.data.targets.countryTrainingTypes}
            errors={form.errors}
            onCountryTargetChange={changeCountryTarget}
            onTrainingTargetChange={changeCountryTrainingTarget}
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
          trainingPerformance={countryTrainingPerformance}
        />
      </div>
    </Card>
  );
}
