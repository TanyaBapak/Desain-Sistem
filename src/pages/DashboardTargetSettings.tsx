import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DASHBOARD_TARGETS, type DashboardTargetKey, type DashboardTargets } from "@/types/dashboard-targets";

interface DashboardTargetSettingsProps {
  targets: DashboardTargets;
}

export function DashboardTargetSettings({ targets }: DashboardTargetSettingsProps) {
  const initialTargets: Record<DashboardTargetKey, string> = {
    registeredJobSeekers: targets.registeredJobSeekers?.toString() ?? "",
    readyForPlacement: targets.readyForPlacement?.toString() ?? "",
    activeTrainingPrograms: targets.activeTrainingPrograms?.toString() ?? "",
    activeVocationalInstitutions: targets.activeVocationalInstitutions?.toString() ?? "",
    nationalRegisteredLpk: targets.nationalRegisteredLpk?.toString() ?? "",
    validatedDemands: targets.validatedDemands?.toString() ?? "",
  };
  const form = useForm({
    targets: initialTargets,
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    form.transform((data) => ({
      targets: Object.fromEntries(
        DASHBOARD_TARGETS.map(({ key }) => [key, Number(data.targets[key])]),
      ),
    }));
    form.patch("/admin/dashboard-targets", {
      preserveScroll: true,
      onSuccess: () => toast.success("Target indikator dashboard berhasil diperbarui."),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Target indikator nasional</CardTitle>
        <CardDescription>
          Atur target berjalan. Capaian pada dashboard pimpinan dihitung dari data aktual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {DASHBOARD_TARGETS.map(({ key, label }) => (
              <label key={key} className="space-y-1.5 text-sm font-medium">
                <span>{label}</span>
                <Input
                  type="number"
                  min="1"
                  max="999999999"
                  step="1"
                  inputMode="numeric"
                  value={form.data.targets[key]}
                  onChange={(event) => form.setData("targets", {
                    ...form.data.targets,
                    [key]: event.target.value,
                  })}
                  aria-invalid={Boolean(form.errors[`targets.${key}`])}
                  required
                />
                {form.errors[`targets.${key}`] && (
                  <span role="alert" className="block text-xs font-normal text-destructive">
                    {form.errors[`targets.${key}`]}
                  </span>
                )}
              </label>
            ))}
          </div>
          {form.errors.targets && <p role="alert" className="text-sm text-destructive">{form.errors.targets}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={form.processing}>
              {form.processing ? "Menyimpan…" : "Simpan target"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
