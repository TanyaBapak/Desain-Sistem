import React, { useMemo } from "react";
import { calculateSectorGaps, formatNum } from "@/components/shared/CascadingFlyoutData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface SectorGapListProps {
  className?: string;
}

export function SectorGapList({ className }: SectorGapListProps) {
  const rows = useMemo(() => calculateSectorGaps(), []);
  const maxVal = useMemo(
    () => Math.max(1, ...rows.map((r) => Math.max(r.demand, r.certified))),
    [rows]
  );

  return (
    <Card className={cn("overflow-hidden border border-border shadow-xs", className)}>
      <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Kesenjangan Supply vs Demand per Sektor
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Analisis perbandingan kuota permintaan luar negeri (Demand) terhadap lulusan tersertifikasi.
            </CardDescription>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground self-start sm:self-auto">
            Diurutkan dari defisit terbesar
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border/60">
        {rows.map((r) => {
          const isDeficit = r.gap > 0;
          const demandWidth = Math.min(100, Math.round((r.demand / maxVal) * 100));
          const certifiedWidth = Math.min(100, Math.round((r.certified / maxVal) * 100));

          return (
            <div key={r.sector} className="p-3.5 sm:p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-2 font-semibold">
                <span className="text-sm text-foreground">{r.sector}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-bold tabular-nums border",
                    isDeficit
                      ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20"
                      : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  )}
                >
                  {isDeficit ? `Kurang ${formatNum(r.gap)}` : `Surplus ${formatNum(-r.gap)}`}
                </Badge>
              </div>

              {/* Demand Bar */}
              <div className="grid grid-cols-[85px_1fr_60px] gap-2 items-center text-xs text-muted-foreground">
                <span className="text-foreground/80 font-medium">Demand</span>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 dark:bg-amber-400 transition-all"
                    style={{ width: `${Math.max(demandWidth, 3)}%` }}
                  />
                </div>
                <b className="text-foreground text-right tabular-nums">{formatNum(r.demand)}</b>
              </div>

              {/* Certified Bar */}
              <div className="grid grid-cols-[85px_1fr_60px] gap-2 items-center text-xs text-muted-foreground mt-1.5">
                <span className="text-foreground/80 font-medium">Tersertifikasi</span>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(certifiedWidth, 3)}%` }}
                  />
                </div>
                <b className="text-foreground text-right tabular-nums">{formatNum(r.certified)}</b>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
