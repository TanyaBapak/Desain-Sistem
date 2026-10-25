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

interface LandingCountryPerformancePreviewProps {
  performance: LandingCountryPerformance[];
}

const numberFormat = new Intl.NumberFormat("id-ID");
const percentageFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

export function LandingCountryPerformancePreview({
  performance,
}: LandingCountryPerformancePreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pratinjau capaian negara semua periode</CardTitle>
        <CardDescription>
          Capaian aktual dihitung dari total kuota terisi pada demand yang disetujui. Periode
          mencakup tahun dengan target manual atau data demand tersimpan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {performance.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            Belum ada target negara atau demand yang disetujui untuk ditampilkan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Capaian target negara penempatan per periode</caption>
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th scope="col" className="p-3 font-medium">Periode</th>
                  <th scope="col" className="p-3 font-medium">Negara</th>
                  <th scope="col" className="p-3 text-right font-medium">Target</th>
                  <th scope="col" className="p-3 text-right font-medium">Capaian</th>
                  <th scope="col" className="p-3 text-right font-medium">Tercapai</th>
                  <th scope="col" className="p-3 text-right font-medium">Sisa target</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {performance.map((item) => (
                  <tr key={`${item.year}-${item.countryId}`}>
                    <td className="p-3 tabular-nums">{item.year}</td>
                    <td className="p-3 font-medium">{item.countryName}</td>
                    <td className="p-3 text-right tabular-nums">{numberFormat.format(item.target)}</td>
                    <td className="p-3 text-right tabular-nums">{numberFormat.format(item.achieved)}</td>
                    <td className="p-3 text-right tabular-nums">
                      {percentageFormat.format(item.percentage)}%
                    </td>
                    <td className="p-3 text-right tabular-nums">{numberFormat.format(item.projected)}</td>
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
