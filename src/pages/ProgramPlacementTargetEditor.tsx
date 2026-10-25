import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  targets: ProgramPlacementTarget[];
  errors: Record<string, string>;
  onAdd: (target: Omit<ProgramPlacementTarget, "key">) => void;
  onChange: (key: string, field: "projectionPlacement" | "target", value: string) => void;
}

export function ProgramPlacementTargetEditor({
  sectors,
  occupations,
  targets,
  errors,
  onAdd,
  onChange,
}: ProgramPlacementTargetEditorProps) {
  const [selectedSector, setSelectedSector] = useState(sectors[0] ?? "");
  const availableOccupations = useMemo(
    () => occupations
      .filter((item) => item.sectorName === selectedSector)
      .map((item) => item.occupationName),
    [occupations, selectedSector],
  );
  const [selectedOccupation, setSelectedOccupation] = useState(availableOccupations[0] ?? "");
  const [projectionPlacement, setProjectionPlacement] = useState("");
  const [target, setTarget] = useState("");

  function changeSector(value: string) {
    setSelectedSector(value);
    setSelectedOccupation(
      occupations.find((item) => item.sectorName === value)?.occupationName ?? "",
    );
  }

  function addTarget() {
    onAdd({
      sectorName: selectedSector,
      occupationName: selectedOccupation,
      projectionPlacement: projectionPlacement.trim(),
      target: target.trim(),
    });
    setProjectionPlacement("");
    setTarget("");
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-base">Proyeksi program penempatan</CardTitle>
        <CardDescription>
          Pilih sektor dan jabatan yang tersedia pada data lembaga vokasi. Isi negara atau wilayah
          penempatan secara manual, lalu tentukan target tahunan.
        </CardDescription>
        {errors["targets.placementTargets"] && (
          <p role="alert" className="text-xs text-destructive">
            {errors["targets.placementTargets"]}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5 px-0">
        {sectors.length === 0 || occupations.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            Data sektor dan jabatan lembaga belum tersedia. Impor data lembaga vokasi terlebih dahulu.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1.5 text-sm font-medium">
                <span>Sektor</span>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedSector}
                  onChange={(event) => changeSector(event.target.value)}
                >
                  {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                <span>Jenis jabatan</span>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedOccupation}
                  onChange={(event) => setSelectedOccupation(event.target.value)}
                >
                  {availableOccupations.map((occupation) => (
                    <option key={occupation} value={occupation}>{occupation}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                <span>Proyeksi penempatan</span>
                <Input
                  value={projectionPlacement}
                  maxLength={255}
                  onChange={(event) => setProjectionPlacement(event.target.value)}
                  placeholder="Contoh: Jepang (SSW), Taiwan"
                />
              </label>
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
                disabled={!selectedSector || !selectedOccupation || !projectionPlacement.trim() || target === ""}
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
