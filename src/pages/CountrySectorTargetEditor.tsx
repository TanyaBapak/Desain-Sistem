import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CountrySectorTargetEditorProps {
  year: string;
  countries: { id: string; name: string }[];
  sectors: { id: string; name: string }[];
  targets: Record<string, Record<string, string>>;
  errors: Record<string, string>;
  onTargetChange: (countryId: string, sectorId: string, value: string) => void;
}

export function CountrySectorTargetEditor({
  year,
  countries,
  sectors,
  targets,
  errors,
  onTargetChange,
}: CountrySectorTargetEditorProps) {
  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>(() => {
    const configuredCountries = countries
      .filter(({ id }) => sectors.some(({ id: sectorId }) => targets[id]?.[sectorId]))
      .map(({ id }) => id);

    return configuredCountries.length > 0 ? configuredCountries : countries.slice(0, 1).map(({ id }) => id);
  });
  const [selectedSectorId, setSelectedSectorId] = useState(sectors[0]?.id ?? "");
  const configuredTargets = countries.flatMap((country) =>
    sectors.flatMap((sector) => {
      const value = targets[country.id]?.[sector.id];
      return value ? [{ country, sector, value }] : [];
    }),
  );

  useEffect(() => {
    const configuredCountries = countries
      .filter(({ id }) => sectors.some(({ id: sectorId }) => targets[id]?.[sectorId]))
      .map(({ id }) => id);

    setSelectedCountryIds(
      configuredCountries.length > 0 ? configuredCountries : countries.slice(0, 1).map(({ id }) => id),
    );
  }, [year]);

  function toggleCountry(countryId: string, checked: boolean) {
    setSelectedCountryIds((current) => (
      checked
        ? [...new Set([...current, countryId])]
        : current.filter((id) => id !== countryId)
    ));
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-base">Target negara dan sektor</CardTitle>
        <CardDescription>
          Tetapkan target tahunan untuk kombinasi negara dan sektor. Capaian dihitung otomatis dari
          kuota demand yang sudah terisi dan disetujui. Jika target tidak diisi, kuota demand menjadi
          target otomatis.
        </CardDescription>
        {errors["targets.countrySectors"] && (
          <p role="alert" className="text-xs text-destructive">
            {errors["targets.countrySectors"]}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5 px-0">
        {countries.length === 0 || sectors.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            Data negara atau sektor belum tersedia. Lengkapi master data terlebih dahulu.
          </p>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Pilih satu atau beberapa negara</legend>
                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
                  {countries.map(({ id, name }) => (
                    <label key={id} className="flex min-h-10 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        checked={selectedCountryIds.includes(id)}
                        onChange={(event) => toggleCountry(id, event.target.checked)}
                      />
                      <span>{name}</span>
                    </label>
                  ))}
                </div>
                {selectedCountryIds.length === 0 && (
                  <p className="text-xs text-muted-foreground">Pilih minimal satu negara untuk mengisi target.</p>
                )}
              </fieldset>
              <label className="space-y-1.5 text-sm font-medium">
                <span>Sektor</span>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedSectorId}
                  onChange={(event) => setSelectedSectorId(event.target.value)}
                  aria-label="Pilih sektor target"
                >
                  {sectors.map(({ id, name }) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {countries
                .filter(({ id }) => selectedCountryIds.includes(id))
                .map(({ id, name }) => (
                  <label key={id} className="space-y-1.5 text-sm font-medium">
                    <span>Total target — {name}</span>
                    <Input
                      type="number"
                      min="0"
                      max="999999999"
                      step="1"
                      inputMode="numeric"
                      value={targets[id]?.[selectedSectorId] ?? ""}
                      onChange={(event) => onTargetChange(id, selectedSectorId, event.target.value)}
                      aria-label={`Total target ${name} untuk sektor ${sectors.find((sector) => sector.id === selectedSectorId)?.name ?? ""}`}
                      aria-invalid={Boolean(errors[`targets.countrySectors.${id}.${selectedSectorId}`])}
                    />
                    {errors[`targets.countrySectors.${id}.${selectedSectorId}`] && (
                      <span role="alert" className="block text-xs font-normal text-destructive">
                        {errors[`targets.countrySectors.${id}.${selectedSectorId}`]}
                      </span>
                    )}
                  </label>
                ))}
            </div>
            {configuredTargets.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Target yang sudah diatur</h3>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {configuredTargets.map(({ country, sector, value }) => (
                    <li
                      key={`${country.id}-${sector.id}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <span>{country.name} · {sector.name}</span>
                      <span className="font-semibold tabular-nums">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
