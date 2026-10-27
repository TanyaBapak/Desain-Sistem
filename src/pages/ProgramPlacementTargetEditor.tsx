import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MultiSelectDropdown } from "@/components/shared/MultiSelectDropdown";

export interface ProgramPlacementTarget {
  key: string;
  id?: number;
  sectorName: string;
  occupationName: string;
  projectionPlacement: string;
  target: string;
}

interface ProgramPlacementTargetEditorProps {
  sectors: string[];
  occupations: { sectorName: string; occupationName: string }[];
  countries: { id: string; name: string }[];
  targets: ProgramPlacementTarget[];
  errors: Record<string, string>;
  onAdd: (targets: Omit<ProgramPlacementTarget, "key">[]) => void;
  onChange: (key: string, field: "projectionPlacement" | "target", value: string) => void;
}

export function ProgramPlacementTargetEditor({
  sectors,
  occupations,
  countries,
  targets,
  errors,
  onAdd,
  onChange,
}: ProgramPlacementTargetEditorProps) {
  const [selectedSectors, setSelectedSectors] = useState<string[]>(() =>
    sectors[0] ? [sectors[0]] : [],
  );
  const availableOccupations = useMemo(
    () =>
      Array.from(
        new Set(
          occupations
            .filter((item) => selectedSectors.includes(item.sectorName))
            .map((item) => item.occupationName),
        ),
      ),
    [occupations, selectedSectors],
  );
  const [selectedOccupations, setSelectedOccupations] = useState<string[]>(() =>
    availableOccupations[0] ? [availableOccupations[0]] : [],
  );
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [target, setTarget] = useState("");

  const selectedPairs = selectedSectors.flatMap((sectorName) =>
    selectedOccupations
      .filter((occupationName) =>
        occupations.some(
          (item) =>
            item.sectorName === sectorName &&
            item.occupationName === occupationName,
        ),
      )
      .map((occupationName) => ({ sectorName, occupationName })),
  );

  function changeSectors(nextSectors: string[]) {
    setSelectedSectors(nextSectors);
    const nextOccupations = Array.from(
      new Set(
        occupations
          .filter((item) => nextSectors.includes(item.sectorName))
          .map((item) => item.occupationName),
      ),
    );
    setSelectedOccupations((current) => {
      const retained = current.filter((occupation) =>
        nextOccupations.includes(occupation),
      );
      return retained.length > 0 ? retained : nextOccupations.slice(0, 1);
    });
  }

  function addTarget() {
    const projectionPlacement = selectedCountries
      .map((countryId) => countries.find((country) => country.id === countryId)?.name)
      .filter((country): country is string => Boolean(country))
      .join(", ");
    onAdd(
      selectedPairs.map(({ sectorName, occupationName }) => ({
        sectorName,
        occupationName,
        projectionPlacement,
        target: target.trim(),
      })),
    );
    setSelectedCountries([]);
    setTarget("");
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-base">Proyeksi program penempatan</CardTitle>
        <CardDescription>
          Pilih beberapa sektor, jabatan, dan negara tujuan. Target berlaku untuk setiap kombinasi
          sektor dan jabatan; target negara dibagi ke seluruh negara yang dipilih.
        </CardDescription>
        {errors["targets.placementTargets"] && (
          <p role="alert" className="text-xs text-destructive">
            {errors["targets.placementTargets"]}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5 px-0">
        {sectors.length === 0 || occupations.length === 0 || countries.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            Data sektor, jabatan, atau negara belum tersedia. Periksa data lembaga vokasi dan master negara terlebih dahulu.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MultiSelectDropdown
                label="Sektor"
                placeholder="Pilih sektor"
                options={sectors.map((sector) => ({ value: sector, label: sector }))}
                selectedValues={selectedSectors}
                onChange={changeSectors}
              />
              <MultiSelectDropdown
                label="Jenis jabatan"
                placeholder="Pilih jabatan"
                options={availableOccupations.map((occupation) => ({
                  value: occupation,
                  label: occupation,
                }))}
                selectedValues={selectedOccupations}
                onChange={setSelectedOccupations}
              />
              <MultiSelectDropdown
                label="Negara tujuan penempatan"
                placeholder="Pilih negara"
                options={countries.map((country) => ({
                  value: country.id,
                  label: country.name,
                }))}
                selectedValues={selectedCountries}
                onChange={setSelectedCountries}
              />
              <label className="space-y-1.5 text-sm font-medium">
                <span>Target</span>
                <Input
                  type="number"
                  min="0"
                  max="999999999"
                  step="1"
                  inputMode="numeric"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  placeholder="Jumlah peserta"
                />
              </label>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={
                  selectedPairs.length === 0 ||
                  selectedCountries.length === 0 ||
                  target === "" ||
                  countries.length === 0
                }
                onClick={addTarget}
              >
                Tambah proyeksi
              </Button>
            </div>
          </>
        )}

        {targets.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Belum ada proyeksi penempatan untuk periode ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Target program penempatan berdasarkan periode</caption>
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th scope="col" className="p-3 font-medium">Sektor</th>
                  <th scope="col" className="p-3 font-medium">Jenis jabatan</th>
                  <th scope="col" className="p-3 font-medium">Proyeksi penempatan</th>
                  <th scope="col" className="w-36 p-3 text-right font-medium">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {targets.map((item, index) => (
                  <tr key={item.key}>
                    <td className="p-3 font-medium">{item.sectorName}</td>
                    <td className="p-3">{item.occupationName}</td>
                    <td className="p-3">
                      <Input
                        value={item.projectionPlacement}
                        maxLength={255}
                        onChange={(event) => onChange(item.key, "projectionPlacement", event.target.value)}
                        aria-label={`Proyeksi penempatan ${item.occupationName}`}
                        aria-invalid={Boolean(errors[`targets.placementTargets.${index}.projectionPlacement`])}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        max="999999999"
                        step="1"
                        inputMode="numeric"
                        value={item.target}
                        onChange={(event) => onChange(item.key, "target", event.target.value)}
                        aria-label={`Target ${item.occupationName}`}
                        aria-invalid={Boolean(errors[`targets.placementTargets.${index}.target`])}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
