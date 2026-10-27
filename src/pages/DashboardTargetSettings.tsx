import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LANDING_KPI_TARGET_FIELDS,
  LandingKpiTargetFields,
} from "@/pages/LandingKpiTargetFields";
import {
  LandingPlacementTargetPreview,
  type LandingPlacementTargetRow,
} from "@/pages/LandingPlacementTargetPreview";
import {
  ProgramPlacementTargetEditor,
  type ProgramPlacementTarget,
} from "@/pages/ProgramPlacementTargetEditor";
import { TargetPeriodSelector } from "@/pages/TargetPeriodSelector";
import { LandingProjectionCountrySelector } from "@/pages/LandingProjectionCountrySelector";

type KpiTargetKey = (typeof LANDING_KPI_TARGET_FIELDS)[number]["key"];
type PlacementTargetInput = Omit<ProgramPlacementTarget, "key">;
type TargetForm = {
  year: string;
  targets: Record<KpiTargetKey, string> & {
    placementTargets: ProgramPlacementTarget[];
    projectionCountries: string[];
  };
};

export interface DashboardTargetSettingsProps {
  countries: { id: string; name: string }[];
  projectionCountryOptions: string[];
  projectionCountries: string[];
  targets: {
    year: number;
    targets: Record<KpiTargetKey, number | null>;
  }[];
  placementOptions: {
    sectors: string[];
    occupations: { sectorName: string; occupationName: string }[];
  };
  placementTargets: LandingPlacementTargetRow[];
}

export function DashboardTargetSettings({
  countries,
  projectionCountryOptions,
  projectionCountries,
  targets,
  placementOptions,
  placementTargets,
}: DashboardTargetSettingsProps) {
  const currentYear = new Date().getFullYear();
  const targetByYear = new Map(targets.map((target) => [target.year, target.targets]));
  const placementTargetsByYear = groupTargetsByYear(placementTargets);
  const availableYears = Array.from(
    new Set([
      currentYear,
      ...targets.map((target) => target.year),
      ...placementTargets.map((target) => target.year),
    ]),
  ).sort((left, right) => right - left);
  const currentTargets = targetByYear.get(currentYear);
  const form = useForm<TargetForm>({
    year: currentYear.toString(),
    targets: {
      ...Object.fromEntries(
        LANDING_KPI_TARGET_FIELDS.map(({ key }) => [
          key,
          currentTargets?.[key]?.toString() ?? "",
        ]),
      ) as Record<KpiTargetKey, string>,
      placementTargets: placementTargetsByYear.get(currentYear) ?? [],
      projectionCountries,
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
        placementTargets: data.targets.placementTargets.map((item) => ({
          ...(item.id ? { id: item.id } : {}),
          sectorName: item.sectorName,
          occupationName: item.occupationName,
          projectionPlacement: item.projectionPlacement.trim(),
          target: Number(item.target),
        })),
        projectionCountries: data.targets.projectionCountries,
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
      placementTargets: placementTargetsByYear.get(Number(value)) ?? [],
      projectionCountries: form.data.targets.projectionCountries,
    });
  }

  function changeKpiTarget(key: KpiTargetKey, value: string) {
    form.setData("targets", { ...form.data.targets, [key]: value });
  }

  function changeProjectionCountries(countryIds: string[]) {
    form.setData("targets", {
      ...form.data.targets,
      projectionCountries: countryIds,
    });
  }

  function addPlacementTarget(targets: PlacementTargetInput[]) {
    form.setData("targets", {
      ...form.data.targets,
      placementTargets: [
        ...form.data.targets.placementTargets,
        ...targets.map((target) => ({
          ...target,
          key: `new-${crypto.randomUUID()}`,
        })),
      ],
    });
  }

  function changePlacementTarget(
    key: string,
    field: "projectionPlacement" | "target",
    value: string,
  ) {
    form.setData("targets", {
      ...form.data.targets,
      placementTargets: form.data.targets.placementTargets.map((target) =>
        target.key === key ? { ...target, [field]: value } : target,
      ),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Target dan proyeksi program penempatan</CardTitle>
        <CardDescription>
          Atur target tahunan untuk setiap sektor dan jenis jabatan. Proyeksi negara atau wilayah
          penempatan diisi manual dan bisa berisi lebih dari satu tujuan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
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
          <LandingProjectionCountrySelector
            countries={projectionCountryOptions}
            selectedCountries={form.data.targets.projectionCountries}
            onChange={changeProjectionCountries}
          />
          <ProgramPlacementTargetEditor
            sectors={placementOptions.sectors}
            occupations={placementOptions.occupations}
            countries={countries}
            targets={form.data.targets.placementTargets}
            errors={form.errors}
            onAdd={addPlacementTarget}
            onChange={changePlacementTarget}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={form.processing}>
              {form.processing ? "Menyimpan…" : `Simpan target ${form.data.year}`}
            </Button>
          </div>
        </form>
      </CardContent>
      <div className="border-t border-border p-4 sm:p-6">
        <LandingPlacementTargetPreview targets={placementTargets} />
      </div>
    </Card>
  );
}

function groupTargetsByYear(
  targets: LandingPlacementTargetRow[],
): Map<number, ProgramPlacementTarget[]> {
  const grouped = new Map<number, ProgramPlacementTarget[]>();
  for (const item of targets) {
    const yearTargets = grouped.get(item.year) ?? [];
    yearTargets.push({
      key: item.id === undefined ? `saved-${yearTargets.length}` : `saved-${item.id}`,
      ...(item.id === undefined ? {} : { id: item.id }),
      sectorName: item.sectorName,
      occupationName: item.occupationName,
      projectionPlacement: item.projectionPlacement,
      target: item.target.toString(),
    });
    grouped.set(item.year, yearTargets);
  }

  return grouped;
}
