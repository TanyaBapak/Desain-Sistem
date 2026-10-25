import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface LandingCountryPerformance {
  year: number;
  countryId: string;
  countryName: string;
  target: number;
  achieved: number;
  projected: number;
  percentage: number;
}

interface LandingCountrySectorPerformance {
  year: number;
  countryId: string;
  countryName: string;
  sectorId: string;
  sectorName: string;
  target: number;
  achieved: number;
  projected: number;
  percentage: number;
}

interface LandingCountryPerformancePreviewProps {
  performance: LandingCountryPerformance[];
  sectorPerformance: LandingCountrySectorPerformance[];
}

const numberFormat = new Intl.NumberFormat("id-ID");
const percentageFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

export function LandingCountryPerformancePreview({
  performance,
  sectorPerformance,
}: LandingCountryPerformancePreviewProps) {
  const [selectedYear, setSelectedYear] = useState("all");
  const years = Array.from(
    new Set([...performance, ...sectorPerformance].map((item) => item.year)),
  ).sort((left, right) => right - left);
  const visiblePerformance = performance.filter(
    (item) => selectedYear === "all" || item.year === Number(selectedYear),
  );
  const visibleSectorPerformance = sectorPerformance.filter(
    (item) => selectedYear === "all" || item.year === Number(selectedYear),
  );

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-lg">Pratinjau capaian target</CardTitle>
          <CardDescription>
            Pilih seluruh periode atau satu periode. Capaian berasal dari kuota demand disetujui
            yang sudah terisi.
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
      <CardContent className="space-y-6">
        <PerformanceTable
          title="Capaian per negara"
          emptyMessage="Belum ada target negara atau demand yang disetujui untuk periode ini."
          headers={["Periode", "Negara"]}
          rows={visiblePerformance.map((item) => ({
            key: `${item.year}-${item.countryId}`,
            year: item.year,
            name: item.countryName,
            target: item.target,
            achieved: item.achieved,
            percentage: item.percentage,
            projected: item.projected,
          }))}
        />
        <PerformanceTable
          title="Capaian per negara dan sektor"
          emptyMessage="Belum ada target sektor atau demand yang disetujui untuk periode ini."
          headers={["Periode", "Negara", "Sektor"]}
          rows={visibleSectorPerformance.map((item) => ({
            key: `${item.year}-${item.countryId}-${item.sectorId}`,
            year: item.year,
            name: item.countryName,
            detail: item.sectorName,
            target: item.target,
            achieved: item.achieved,
            percentage: item.percentage,
            projected: item.projected,
          }))}
        />
      </CardContent>
    </Card>
  );
}

function PerformanceTable({
  title,
  emptyMessage,
  headers,
  rows,
}: {
  title: string;
  emptyMessage: string;
  headers: string[];
  rows: {
    key: string;
    year: number;
    name: string;
    detail?: string;
    target: number;
    achieved: number;
    percentage: number;
    projected: number;
  }[];
}) {
  return (
    <section className="space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="border-b text-muted-foreground">
              <tr>
                {headers.map((header) => (
                  <th key={header} scope="col" className="p-3 font-medium">{header}</th>
                ))}
                <th scope="col" className="p-3 text-right font-medium">Target</th>
                <th scope="col" className="p-3 text-right font-medium">Capaian</th>
                <th scope="col" className="p-3 text-right font-medium">Tercapai</th>
                <th scope="col" className="p-3 text-right font-medium">Sisa target</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((item) => (
                <tr key={item.key}>
                  <td className="p-3 tabular-nums">{item.year}</td>
                  <td className="p-3 font-medium">{item.name}</td>
                  {item.detail !== undefined && <td className="p-3">{item.detail}</td>}
                  <td className="p-3 text-right tabular-nums">{numberFormat.format(item.target)}</td>
                  <td className="p-3 text-right tabular-nums">{numberFormat.format(item.achieved)}</td>
                  <td className="p-3 text-right tabular-nums">{percentageFormat.format(item.percentage)}%</td>
                  <td className="p-3 text-right tabular-nums">{numberFormat.format(item.projected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
