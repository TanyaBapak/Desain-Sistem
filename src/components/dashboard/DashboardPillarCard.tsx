import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface DashboardPillarCardProps {
  label: string;
  pillar: "supply" | "program" | "vokasi" | "demand" | "matching";
  pillarLabel: string;
  value: number | string;
  unit?: string;
  desc: string;
  badge?: string;
  icon: React.ElementType;
  progressPercent?: number;
  progressLabel?: string;
  onDrilldown?: () => void;
  onOpenPage?: () => void;
  pageActionLabel?: string;
  children?: React.ReactNode;
}

const PILLAR_STYLES: Record<
  DashboardPillarCardProps["pillar"],
  { badgeClass: string; iconBgClass: string; textClass: string; borderHoverClass: string }
> = {
  supply: {
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    iconBgClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    textClass: "text-blue-600 dark:text-blue-400",
    borderHoverClass: "hover:border-blue-500/50",
  },
  program: {
    badgeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
    iconBgClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    textClass: "text-indigo-600 dark:text-indigo-400",
    borderHoverClass: "hover:border-indigo-500/50",
  },
  vokasi: {
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    iconBgClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    textClass: "text-emerald-600 dark:text-emerald-400",
    borderHoverClass: "hover:border-emerald-500/50",
  },
  demand: {
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    iconBgClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    textClass: "text-amber-600 dark:text-amber-400",
    borderHoverClass: "hover:border-amber-500/50",
  },
  matching: {
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    iconBgClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    textClass: "text-purple-600 dark:text-purple-400",
    borderHoverClass: "hover:border-purple-500/50",
  },
};

export function DashboardPillarCard({
  label,
  pillar,
  pillarLabel,
  value,
  unit,
  desc,
  badge,
  icon: Icon,
  progressPercent,
  progressLabel,
  onDrilldown,
  onOpenPage,
  pageActionLabel = "Lihat Sub-Halaman",
  children,
}: DashboardPillarCardProps) {
  const styles = PILLAR_STYLES[pillar];

  return (
    <Card
      className={cn(
        "flex flex-col justify-between transition-all duration-200 border-border bg-card shadow-xs group",
        styles.borderHoverClass
      )}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
              styles.badgeClass
            )}
          >
            {pillarLabel}
          </span>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              styles.iconBgClass
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-2">
          <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {label}
          </CardTitle>
          <CardDescription className="text-xs line-clamp-1">{desc}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl lg:text-3xl font-bold tabular-nums text-foreground">
            {typeof value === "number" ? value.toLocaleString("id-ID") : value}
            {unit && <span className="text-xs font-normal text-muted-foreground ml-1.5">{unit}</span>}
          </div>
          {badge && (
            <Badge variant="outline" className={cn("text-[11px] font-semibold", styles.badgeClass)}>
              {badge}
            </Badge>
          )}
        </div>

        {progressPercent !== undefined && (
          <div className="space-y-1">
            {progressLabel && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate">{progressLabel}</span>
                <span className="tabular-nums font-semibold text-foreground">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            )}
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", styles.iconBgClass.replace("bg-", "bg-"))}
                style={{
                  width: `${Math.min(Math.max(progressPercent, 3), 100)}%`,
                  backgroundColor: "currentColor",
                }}
              />
            </div>
          </div>
        )}

        {children}

        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
          {onOpenPage && (
            <button
              type="button"
              onClick={onOpenPage}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-left text-xs"
            >
              <span>{pageActionLabel}</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
          {onDrilldown && (
            <button
              type="button"
              onClick={onDrilldown}
              className="text-[11px] text-muted-foreground hover:text-foreground font-medium underline-offset-2 hover:underline ml-auto"
            >
              Rincian data &rarr;
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
