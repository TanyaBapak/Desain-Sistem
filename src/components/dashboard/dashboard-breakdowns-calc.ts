import { CandidateParticipant, GlobalDemand, VocationalProvider } from "@/types";
import { ExecutiveDashboardBreakdownsData, ProvinceBreakdownItem } from "@/components/reports/ExecutiveDashboardBreakdowns";

export function calculateDashboardBreakdowns(
  candidates: CandidateParticipant[],
  demands: GlobalDemand[],
  providers: VocationalProvider[],
  lpkProviders: VocationalProvider[],
  nationalLpkByProvince?: ProvinceBreakdownItem[]
): ExecutiveDashboardBreakdownsData {
  const countBy = <T,>(items: T[], getKey: (item: T) => string) => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      const key = getKey(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts, ([status, count]) => ({ status, count }));
  };

  const calculateProvinceBreakdown = (items: typeof providers) => {
    const map = new Map<string, { totalCount: number; registeredCount: number }>();
    items.forEach((item) => {
      const prov = item.provinsi || "Belum dipetakan";
      const current = map.get(prov) ?? { totalCount: 0, registeredCount: 0 };
      const isRegistered = item.evokasiVerificationStatus === "Terverifikasi e-Vokasi";
      map.set(prov, {
        totalCount: current.totalCount + 1,
        registeredCount: current.registeredCount + (isRegistered ? 1 : 0),
      });
    });
    return Array.from(map, ([province, stats]) => ({
      province,
      totalCount: stats.totalCount,
      registeredCount: stats.registeredCount,
    }))
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 8);
  };

  const institutionsByProvince = calculateProvinceBreakdown(providers);
  const lpkByProvince = calculateProvinceBreakdown(lpkProviders);

  const demandByCountry = new Map<string, { demandCount: number; quota: number; filledQuota: number }>();

  demands.forEach((demand) => {
    const country = demand.country || "Belum ditentukan";
    const current = demandByCountry.get(country) ?? { demandCount: 0, quota: 0, filledQuota: 0 };
    demandByCountry.set(country, {
      demandCount: current.demandCount + 1,
      quota: current.quota + demand.requiredQuota,
      filledQuota: current.filledQuota + demand.filledQuota,
    });
  });

  return {
    candidateLifecycle: countBy(candidates, (candidate) => candidate.lifecycleStatus ?? "Belum ditentukan"),
    candidatesByProvince: countBy(candidates, (candidate) => candidate.provinsi || "Belum dipetakan")
      .map(({ status, count }) => ({ province: status, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8),
    institutionsByEvokasiStatus: countBy(providers, (provider) => provider.evokasiVerificationStatus),
    institutionsByProvince,
    lpkByProvince,
    nationalLpkByProvince,
    demandByCountry: Array.from(demandByCountry, ([country, summary]) => ({ country, ...summary }))
      .sort((left, right) => right.quota - left.quota),
  };
}
