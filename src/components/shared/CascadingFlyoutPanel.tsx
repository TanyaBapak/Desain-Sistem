import React from "react";
import {
  PillarConfig,
  TreeNode,
  MetricSpec,
  formatNum,
} from "@/components/shared/CascadingFlyoutData";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PanelContentProps {
  levelIndex: number;
  node: TreeNode;
  pillar: PillarConfig;
  metricKey: keyof MetricSpec;
  selectedChildIndex?: number;
  onSelectChild: (childIdx: number, el: HTMLElement) => void;
  onHoverChild: (childIdx: number, el: HTMLElement) => void;
  onBack: () => void;
  onSetMetric: (m: keyof MetricSpec) => void;
  onOpenFullModal?: () => void;
  isMobile: boolean;
}

export function PanelContent({
  levelIndex,
  node,
  pillar,
  metricKey,
  selectedChildIndex,
  onSelectChild,
  onHoverChild,
  onBack,
  onSetMetric,
  onOpenFullModal,
  isMobile,
}: PanelContentProps) {
  const isLeaf = Boolean("leaf" in node && node.leaf);

  if (isLeaf && "info" in node) {
    const leafNode = node;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/20">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {pillar.lv[levelIndex - 1] || "Detail"} · Rincian
          </div>
          <div className="text-sm font-bold text-foreground flex items-center gap-2 mt-0.5">
            {isMobile && (
              <button
                type="button"
                onClick={onBack}
                className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs"
              >
                ‹
              </button>
            )}
            <span className="truncate">{leafNode.name}</span>
          </div>
        </div>

        <div className="p-3.5 space-y-3 overflow-y-auto">
          {/* Funnel bars */}
          <div className="space-y-2">
            {pillar.k.map(([x, l]) => {
              const val = leafNode.m[x];
              const pct = Math.min(100, Math.round((val / (leafNode.m.a || 1)) * 100));
              return (
                <div key={x} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">{l}</span>
                    <b className="text-foreground tabular-nums">{formatNum(val)}</b>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key-Value attributes */}
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs pt-3 border-t border-border">
            {leafNode.info.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-muted-foreground">{k}:</dt>
                <dd className="font-semibold text-foreground text-right truncate">{v}</dd>
              </React.Fragment>
            ))}
          </dl>

          {onOpenFullModal && (
            <button
              type="button"
              onClick={onOpenFullModal}
              className="mt-2 w-full py-2 px-3 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Buka Modal Lengkap</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Internal Node (List of children)
  const internalNode = node as { name: string; ch: TreeNode[] };
  const maxVal = Math.max(1, ...internalNode.ch.map((c) => (c.m ? c.m[metricKey] : 0)));
  const sortedItems = internalNode.ch
    .map((c, i) => ({ c, i }))
    .sort((a, b) => ((b.c.m ? b.c.m[metricKey] : 0) - (a.c.m ? a.c.m[metricKey] : 0)));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border bg-muted/20">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Pilih {pillar.lv[levelIndex]?.toLowerCase() || "item"}
        </div>
        <div className="text-sm font-bold text-foreground flex items-center gap-2 mt-0.5">
          {isMobile && levelIndex > 0 && (
            <button
              type="button"
              onClick={onBack}
              className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs"
            >
              ‹
            </button>
          )}
          <span className="truncate">{levelIndex === 0 ? pillar.t : node.name}</span>
        </div>

        {/* Metric selection chips on level 0 */}
        {levelIndex === 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {pillar.k.map(([x, l]) => (
              <button
                key={x}
                type="button"
                onClick={() => onSetMetric(x)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                  metricKey === x
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-1.5 overflow-y-auto space-y-1 flex-1">
        {sortedItems.map(({ c, i }) => {
          const val = c.m ? c.m[metricKey] : 0;
          const isSelected = selectedChildIndex === i;
          const isLeafChild = Boolean("leaf" in c && c.leaf);
          const barWidth = Math.max(3, Math.round((val / maxVal) * 100));

          return (
            <div
              key={c.name}
              onClick={(e) => onSelectChild(i, e.currentTarget)}
              onMouseEnter={(e) => onHoverChild(i, e.currentTarget)}
              className={cn(
                "relative grid grid-cols-[1fr_auto_14px] gap-2 items-center p-2 rounded-xl cursor-pointer transition-all",
                isSelected ? "bg-primary/15 font-semibold" : "hover:bg-muted/70"
              )}
            >
              {/* Proportional background bar */}
              <div
                className="absolute inset-y-0 left-0 bg-primary/15 dark:bg-primary/25 rounded-xl pointer-events-none transition-all"
                style={{ width: `${barWidth}%` }}
              />

              <div className="relative min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{c.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {"ch" in c && c.ch ? `${c.ch.length} ${pillar.lv[levelIndex + 1]?.toLowerCase() || "item"}` : "Rincian"}
                </div>
              </div>

              <div className="relative text-xs font-bold tabular-nums text-foreground">
                {formatNum(val)}
              </div>

              <div className="relative text-xs text-muted-foreground">
                {!isLeafChild ? "›" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
