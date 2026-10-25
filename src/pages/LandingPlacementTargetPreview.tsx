import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface LandingPlacementTargetRow {
  id?: number;
  year: number;
  sectorName: string;
  occupationName: string;
  projectionPlacement: string;
  target: number;
}

export function LandingPlacementTargetPreview({
  targets,
}: {
  targets: LandingPlacementTargetRow[];
}) {
  const [selectedYear, setSelectedYear] = useState("all");
  const years = Array.from(new Set(targets.map((item) => item.year))).sort(
    (left, right) => right - left,
  );
  const visibleTargets = targets.filter(
    (item) => selectedYear === "all" || item.year === Number(selectedYear),
  );

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-lg">Pratinjau proyeksi penempatan</CardTitle>
          <CardDescription>
            Daftar target manual berdasarkan sektor, jabatan, dan negara atau wilayah tujuan.
          </CardDescription>
        </div>
        <label className="flex shrink-0 flex-col gap-1.5 text-sm font-medium">
          <span>Periode pratinjau</span>
          <select
            className="h-10 min-w-40 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
          >
            <option value="all">Semua periode</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
      </CardHeader>
      <CardContent>
        {visibleTargets.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            Belum ada data target proyeksi untuk periode ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Target proyeksi penempatan menurut periode</caption>
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th scope="col" className="p-3 font-medium">Periode</th>
                  <th scope="col" className="p-3 font-medium">Sektor</th>
                  <th scope="col" className="p-3 font-medium">Jenis jabatan</th>
                  <th scope="col" className="p-3 font-medium">Proyeksi penempatan</th>
                  <th scope="col" className="p-3 text-right font-medium">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleTargets.map((item, index) => (
                  <tr key={`${item.year}-${item.id ?? index}`}>
                    <td className="p-3 tabular-nums">{item.year}</td>
                    <td className="p-3 font-medium">{item.sectorName}</td>
                    <td className="p-3">{item.occupationName}</td>
                    <td className="p-3">{item.projectionPlacement}</td>
                    <td className="p-3 text-right tabular-nums">
                      {new Intl.NumberFormat("id-ID").format(item.target)}
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
