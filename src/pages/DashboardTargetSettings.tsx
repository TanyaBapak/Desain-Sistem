import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
}

const targetFields = [
  { key: "registeredJobSeekers", label: "Pencari kerja terdaftar" },
  { key: "readyForPlacement", label: "Siap penempatan" },
  { key: "activeTrainingPrograms", label: "Program pelatihan aktif" },
  { key: "activeVocationalInstitutions", label: "Lembaga vokasi aktif" },
  { key: "nationalLpkCount", label: "LPK terdaftar nasional" },
  { key: "validatedDemandCount", label: "Permintaan tervalidasi" },
] as const;

export function DashboardTargetSettings({ targets }: DashboardTargetSettingsProps) {
  const currentYear = new Date().getFullYear();
  const targetByYear = new Map(targets.map((target) => [target.year, target.targets]));
  const emptyTargets = Object.fromEntries(targetFields.map(({ key }) => [key, ""])) as Record<
    (typeof targetFields)[number]["key"],
    string
  >;
  const currentTargets = targetByYear.get(currentYear);
  const form = useForm({
    year: currentYear.toString(),
    targets: Object.fromEntries(
      targetFields.map(({ key }) => [key, currentTargets?.[key]?.toString() ?? ""]),
    ) as typeof emptyTargets,
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    form.transform((data) => ({
      year: Number(data.year),
      targets: Object.fromEntries(
        targetFields.map(({ key }) => [key, Number(data.targets[key])]),
      ),
    }));
    form.patch("/admin/dashboard-targets", {
      preserveScroll: true,
      onSuccess: () => toast.success(`Enam target KPI tahun ${form.data.year} berhasil diperbarui.`),
    });
  }

  function changeYear(value: string) {
    form.setData({
      year: value,
      targets: Object.fromEntries(
        targetFields.map(({ key }) => [
          key,
          targetByYear.get(Number(value))?.[key]?.toString() ?? "",
        ]),
      ) as typeof emptyTargets,
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
          <div className="flex justify-end">
            <Button type="submit" disabled={form.processing}>
              {form.processing ? "Menyimpan…" : `Simpan target ${form.data.year}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
