import * as React from "react";
import { Users, GraduationCap, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardQuickActionsProps {
  accessibleTabs?: string[];
  onNavigateModul: (moduleTab: string) => void;
}

export function DashboardQuickActions({
  accessibleTabs,
  onNavigateModul,
}: DashboardQuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(!accessibleTabs || accessibleTabs.includes("modul-a")) && (
        <Button
          type="button"
          variant="outline"
          onClick={() => onNavigateModul("modul-a")}
          className="h-auto w-full justify-start gap-3 whitespace-normal rounded-xl border border-border bg-card p-4 text-left text-foreground shadow-xs hover:bg-muted/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-bold">Input Pencari Kerja (Modul A)</div>
            <div className="text-xs text-muted-foreground">Disnaker / LPK input data calon CPMI</div>
          </div>
        </Button>
      )}

      {(!accessibleTabs || accessibleTabs.includes("modul-b")) && (
        <Button
          type="button"
          variant="outline"
          onClick={() => onNavigateModul("modul-b")}
          className="h-auto w-full justify-start gap-3 whitespace-normal rounded-xl border border-border bg-card p-4 text-left text-foreground shadow-xs hover:bg-muted/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-bold">Kelola Program (Modul B)</div>
            <div className="text-xs text-muted-foreground">Penetapan kurikulum & kuota pelatihan</div>
          </div>
        </Button>
      )}

      {(!accessibleTabs || accessibleTabs.includes("sippmi-monitoring")) && (
        <Button
          type="button"
          variant="outline"
          onClick={() => onNavigateModul("sippmi-monitoring")}
          className="h-auto w-full justify-start gap-3 whitespace-normal rounded-xl border border-border bg-card p-4 text-left text-foreground shadow-xs hover:bg-muted/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Monitor className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-bold">Monitoring SIPPMI (T4-6)</div>
            <div className="text-xs text-muted-foreground">Presensi batch, JP, sertifikasi & berangkat</div>
          </div>
        </Button>
      )}
    </div>
  );
}
