import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TargetPeriodSelectorProps {
  year: string;
  years: number[];
  error?: string;
  onChange: (year: string) => void;
}

export function TargetPeriodSelector({ year, years, error, onChange }: TargetPeriodSelectorProps) {
  const [newYear, setNewYear] = useState("");
  const [addedYears, setAddedYears] = useState<number[]>([]);
  const validNewYear = /^(20\d{2}|21\d{2}|2200)$/.test(newYear);
  const availableYears = Array.from(new Set([...years, ...addedYears])).sort(
    (left, right) => right - left,
  );

  return (
    <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
      <label className="w-full max-w-xs space-y-1.5 text-sm font-medium">
        <span>Periode target</span>
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={year}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        >
          {availableYears.map((optionYear) => (
            <option key={optionYear} value={optionYear}>{optionYear}</option>
          ))}
        </select>
        {error && <span role="alert" className="block text-xs font-normal text-destructive">{error}</span>}
      </label>
      <label className="w-full max-w-xs space-y-1.5 text-sm font-medium">
        <span>Tambah periode tahun</span>
        <Input
          type="number"
          min="2000"
          max="2200"
          step="1"
          inputMode="numeric"
          value={newYear}
          onChange={(event) => setNewYear(event.target.value)}
          aria-label="Tahun periode target baru"
        />
      </label>
      <Button
        type="button"
        variant="outline"
        disabled={!validNewYear}
        onClick={() => {
          setAddedYears((currentYears) => [...new Set([...currentYears, Number(newYear)])]);
          onChange(newYear);
          setNewYear("");
        }}
      >
        Gunakan periode baru
      </Button>
    </div>
  );
}
