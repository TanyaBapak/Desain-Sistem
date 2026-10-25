import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  LandingCountryPerformancePreview,
  type LandingCountryPerformance,
} from "@/pages/LandingCountryPerformancePreview";

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
}

const targetFields = [
  { key: "registeredJobSeekers", label: "Pencari kerja terdaftar" },
  { key: "readyForPlacement", label: "Siap penempatan" },
  { key: "activeTrainingPrograms", label: "Program pelatihan aktif" },
  { key: "activeVocationalInstitutions", label: "Lembaga vokasi aktif" },
  { key: "nationalLpkCount", label: "LPK terdaftar nasional" },
  { key: "validatedDemandCount", label: "Permintaan tervalidasi" },
] as const;

export function DashboardTargetSettings({
  targets,
  countries,
  countryTargets,
  countryPerformance,
}: DashboardTargetSettingsProps) {
  const currentYear = new Date().getFullYear();
  const targetByYear = new Map(targets.map((target) => [target.year, target.targets]));
  const countryTargetByYear = new Map(countryTargets.map((target) => [target.year, target.targets]));
  const currentTargets = targetByYear.get(currentYear);
  const currentCountryTargets = countryTargetByYear.get(currentYear);
  const kpiTargetValues = Object.fromEntries(
    targetFields.map(({ key }) => [key, currentTargets?.[key]?.toString() ?? ""]),
  ) as Record<
    (typeof targetFields)[number]["key"],
    string
  >;
  const form = useForm({
    year: currentYear.toString(),
    targets: {
      ...kpiTargetValues,
      countries: Object.fromEntries(
        countries.map(({ id }) => [id, currentCountryTargets?.[id]?.toString() ?? ""]),
      ),
    },
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    form.transform((data) => ({
      year: Number(data.year),
      targets: {
        ...Object.fromEntries(targetFields.map(({ key }) => [key, Number(data.targets[key])])),
        countries: Object.fromEntries(
          countries.map(({ id }) => [
            id,
            data.targets.countries[id] === "" ? null : Number(data.targets.countries[id]),
          ]),
        ),
      },
    }));
    form.patch("/admin/dashboard-targets", {
      preserveScroll: true,
      onSuccess: () => toast.success(`Target KPI dan negara tahun ${form.data.year} berhasil diperbarui.`),
    });
  }

  function changeYear(value: string) {
    form.setData({
      year: value,
      targets: {
        ...Object.fromEntries(
        targetFields.map(({ key }) => [
          key,
          targetByYear.get(Number(value))?.[key]?.toString() ?? "",
        ]),
        ) as Record<(typeof targetFields)[number]["key"], string>,
        countries: Object.fromEntries(
          countries.map(({ id }) => [
            id,
            countryTargetByYear.get(Number(value))?.[id]?.toString() ?? "",
          ]),
        ),
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
          <div className="grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium">
              <span>Tahun target</span>
              <Input
                type="number"
                min="2000"
                max="2200"
                step="1"
                inputMode="numeric"
                value={form.data.year}
                onChange={(event) => changeYear(event.target.value)}
                aria-invalid={Boolean(form.errors.year)}
                required
              />
              {form.errors.year && (
                <span role="alert" className="block text-xs font-normal text-destructive">
                  {form.errors.year}
                </span>
              )}
            </label>
            {targetFields.map(({ key, label }) => (
              <label key={key} className="space-y-1.5 text-sm font-medium">
                <span>Target: {label}</span>
                <Input
                  type="number"
                  min="1"
                  max="999999999"
                  step="1"
                  inputMode="numeric"
                  value={form.data.targets[key]}
                  onChange={(event) =>
                    form.setData("targets", { ...form.data.targets, [key]: event.target.value })
                  }
                  aria-invalid={Boolean(form.errors[`targets.${key}` as keyof typeof form.errors])}
                  required
                />
                {form.errors[`targets.${key}` as keyof typeof form.errors] && (
                  <span role="alert" className="block text-xs font-normal text-destructive">
                    {form.errors[`targets.${key}` as keyof typeof form.errors]}
                  </span>
                )}
              </label>
            ))}
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <h3 className="text-base font-medium">Target negara penempatan</h3>
              <p className="text-sm text-muted-foreground">
                Capaian dihitung otomatis dari total kuota terisi pada demand berstatus disetujui
                di periode yang dipilih. Kosongkan target untuk memakai kuota demand sebagai target.
              </p>
              {form.errors["targets.countries" as keyof typeof form.errors] && (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  {form.errors["targets.countries" as keyof typeof form.errors]}
                </p>
              )}
            </div>
            {countries.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                Data negara belum tersedia. Isi master negara terlebih dahulu.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {countries.map(({ id, name }) => (
                  <label key={id} className="space-y-1.5 text-sm font-medium">
                    <span>Target: {name}</span>
                    <Input
                      type="number"
                      min="0"
                      max="999999999"
                      step="1"
                      inputMode="numeric"
                      value={form.data.targets.countries[id] ?? ""}
                      onChange={(event) =>
                        form.setData("targets", {
                          ...form.data.targets,
                          countries: { ...form.data.targets.countries, [id]: event.target.value },
                        })
                      }
                      aria-invalid={Boolean(
                        form.errors[`targets.countries.${id}` as keyof typeof form.errors],
                      )}
                    />
                    {form.errors[`targets.countries.${id}` as keyof typeof form.errors] && (
                      <span role="alert" className="block text-xs font-normal text-destructive">
                        {form.errors[`targets.countries.${id}` as keyof typeof form.errors]}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={form.processing}>
              {form.processing ? "Menyimpan…" : `Simpan target ${form.data.year}`}
            </Button>
          </div>
        </form>
      </CardContent>
      <div className="border-t border-border p-4 sm:p-6">
        <LandingCountryPerformancePreview performance={countryPerformance} />
      </div>
    </Card>
  );
}
