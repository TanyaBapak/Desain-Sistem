import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CountryTrainingTargetEditorProps {
  countries: { id: string; name: string }[];
  countryTargets: Record<string, string>;
  countryTrainingTargets: Record<string, Record<string, string>>;
  errors: Record<string, string>;
  onCountryTargetChange: (countryId: string, value: string) => void;
  onTrainingTargetChange: (countryId: string, typeKey: string, value: string) => void;
}

export const COUNTRY_TRAINING_TARGET_TYPES = [
  { key: "upskilling", label: "Upskilling" },
  { key: "reskilling", label: "Reskilling" },
  { key: "language", label: "Pelatihan Bahasa" },
  { key: "integratedTechnical", label: "Teknis Terpadu" },
] as const;

export function CountryTrainingTargetEditor({
  countries,
  countryTargets,
  countryTrainingTargets,
  errors,
  onCountryTargetChange,
  onTrainingTargetChange,
}: CountryTrainingTargetEditorProps) {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-base">Target negara dan jenis pelatihan</CardTitle>
        <CardDescription>
          Atur target demand per negara dan target peserta per jenis pelatihan. Kosongkan target
          untuk memakai kuota demand atau program yang tersimpan. Capaian peserta dihitung otomatis
          dari data peserta terdaftar.
        </CardDescription>
        {errors["targets.countries"] && (
          <p role="alert" className="text-xs text-destructive">{errors["targets.countries"]}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        {countries.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            Data negara belum tersedia. Isi master negara terlebih dahulu.
          </p>
        ) : (
          countries.map(({ id, name }) => (
            <section key={id} className="space-y-4 rounded-lg border border-border p-4">
              <h3 className="font-semibold">{name}</h3>
              <label className="block max-w-sm space-y-1.5 text-sm font-medium">
                <span>Target demand keseluruhan — {name}</span>
                <Input
                  type="number"
                  min="0"
                  max="999999999"
                  step="1"
                  inputMode="numeric"
                  value={countryTargets[id] ?? ""}
                  onChange={(event) => onCountryTargetChange(id, event.target.value)}
                  aria-invalid={Boolean(errors[`targets.countries.${id}`])}
                />
                {errors[`targets.countries.${id}`] && (
                  <span role="alert" className="block text-xs font-normal text-destructive">
                    {errors[`targets.countries.${id}`]}
                  </span>
                )}
              </label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {COUNTRY_TRAINING_TARGET_TYPES.map(({ key, label }) => (
                  <label key={key} className="space-y-1.5 text-sm font-medium">
                    <span>Target {label} — {name}</span>
                    <Input
                      type="number"
                      min="0"
                      max="999999999"
                      step="1"
                      inputMode="numeric"
                      value={countryTrainingTargets[id]?.[key] ?? ""}
                      onChange={(event) => onTrainingTargetChange(id, key, event.target.value)}
                      aria-invalid={Boolean(errors[`targets.countryTrainingTypes.${id}.${key}`])}
                    />
                    {errors[`targets.countryTrainingTypes.${id}.${key}`] && (
                      <span role="alert" className="block text-xs font-normal text-destructive">
                        {errors[`targets.countryTrainingTypes.${id}.${key}`]}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </section>
          ))
        )}
      </CardContent>
    </Card>
  );
}
