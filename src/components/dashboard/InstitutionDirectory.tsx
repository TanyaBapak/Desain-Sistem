import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface InstitutionDirectoryItem {
  id: string;
  name: string;
  type: string;
  province: string;
  district: string;
  accreditation: string | null;
  evokasiStatus: string;
  capacity: number | null;
}

interface InstitutionDirectoryProps {
  institutions: InstitutionDirectoryItem[];
  totalCount: number;
  scopeLabel?: string;
}

export function InstitutionDirectory({
  institutions,
  totalCount,
  scopeLabel = "dalam lingkup Anda",
}: InstitutionDirectoryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-base">Daftar lembaga vokasi</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Cakupan {scopeLabel} · {totalCount.toLocaleString("id-ID")} lembaga aktif
              {institutions.length < totalCount && ` · ${institutions.length} ditampilkan`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {institutions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th scope="col" className="pb-2 pr-4 font-medium">Nama lembaga</th>
                  <th scope="col" className="pb-2 px-4 font-medium">Wilayah</th>
                  <th scope="col" className="pb-2 px-4 font-medium">Status e-Vokasi</th>
                  <th scope="col" className="pb-2 px-4 font-medium">Akreditasi</th>
                  <th scope="col" className="pb-2 pl-4 text-right font-medium">Kapasitas/batch</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {institutions.map((institution) => (
                  <tr key={institution.id}>
                    <th scope="row" className="py-3 pr-4 font-medium text-foreground">
                      <span className="block">{institution.name}</span>
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        {institution.type}
                      </span>
                    </th>
                    <td className="px-4 py-3 text-muted-foreground">
                      {institution.district}, {institution.province}
                    </td>
                    <td className="px-4 py-3">{institution.evokasiStatus}</td>
                    <td className="px-4 py-3">{institution.accreditation || "Belum tersedia"}</td>
                    <td className="py-3 pl-4 text-right tabular-nums">
                      {institution.capacity?.toLocaleString("id-ID") ?? "Belum tersedia"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Belum ada lembaga vokasi aktif pada lingkup ini.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
