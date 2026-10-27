import { Input } from "@/components/ui/input";

type LandingKpiTargetKey = (typeof LANDING_KPI_TARGET_FIELDS)[number]["key"];

interface LandingKpiTargetFieldsProps {
  values: Record<LandingKpiTargetKey, string>;
  errors: Record<string, string>;
  onChange: (key: LandingKpiTargetKey, value: string) => void;
}

export const LANDING_KPI_TARGET_FIELDS = [
  { key: "registeredJobSeekers", label: "Pencari kerja terdaftar" },
  { key: "readyForPlacement", label: "Siap penempatan" },
  { key: "activeTrainingPrograms", label: "Program pelatihan aktif" },
  { key: "activeVocationalInstitutions", label: "Lembaga vokasi aktif" },
  { key: "nationalLpkCount", label: "Lembaga terdaftar nasional" },
  { key: "validatedDemandCount", label: "Permintaan tervalidasi" },
] as const;

export function LandingKpiTargetFields({ values, errors, onChange }: LandingKpiTargetFieldsProps) {
  return (
    <>
      {LANDING_KPI_TARGET_FIELDS.map(({ key, label }) => (
        <label key={key} className="space-y-1.5 text-sm font-medium">
          <span>Target: {label}</span>
          <Input
            type="number"
            min="1"
            max="999999999"
            step="1"
            inputMode="numeric"
            value={values[key] ?? ""}
            onChange={(event) => onChange(key, event.target.value)}
            aria-invalid={Boolean(errors[`targets.${key}`])}
            required
          />
          {errors[`targets.${key}`] && (
            <span role="alert" className="block text-xs font-normal text-destructive">
              {errors[`targets.${key}`]}
            </span>
          )}
        </label>
      ))}
    </>
  );
}
