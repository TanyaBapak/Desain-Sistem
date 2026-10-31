import React, { useState, useMemo } from "react";
import {
  PillarConfig,
  TreeNode,
  MetricSpec,
  formatNum,
  LeafNode,
} from "@/components/shared/CascadingFlyoutData";
import { Layers, Search, User, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CandidateParticipant } from "@/types";
import { CandidateDetailModal } from "@/components/modul-a/CandidateDetailModal";
import { Badge } from "@/components/ui/Badge";

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
  onHoverChild: _onHoverChild,
  onBack,
  onSetMetric,
  onOpenFullModal,
  isMobile: _isMobile,
}: PanelContentProps) {
  const isLeaf = Boolean("leaf" in node && node.leaf);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateParticipant | null>(null);

  if (isLeaf && "info" in node) {
    const leafNode = node as LeafNode;
    const participants: CandidateParticipant[] = leafNode.participants || [];

    const filteredParticipants = participants.filter((p) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.nik.toLowerCase().includes(q) ||
        (p.institutionName && p.institutionName.toLowerCase().includes(q)) ||
        (p.major && p.major.toLowerCase().includes(q))
      );
    });

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-border bg-slate-50 dark:bg-slate-800 shrink-0">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>{pillar.lv[levelIndex - 1] || "Detail"} · Rincian</span>
            {participants.length > 0 && (
              <span className="font-bold text-primary tabular-nums">
                {participants.length} Peserta Terdaftar
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-foreground flex items-center gap-2 mt-0.5">
            {levelIndex > 0 && (
              <button
                type="button"
                onClick={onBack}
                title="Tutup rincian ini"
                className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs hover:bg-primary/20 transition cursor-pointer"
              >
                ‹
              </button>
            )}
            <span className="truncate">{leafNode.name}</span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-3 space-y-3 overflow-y-auto flex-1">
          {/* Key-Value attributes summary */}
          <dl className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 text-xs p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-border/60">
            {leafNode.info.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-muted-foreground">{k}:</dt>
                <dd className="font-semibold text-foreground text-right truncate">{v}</dd>
              </React.Fragment>
            ))}
          </dl>

          {/* Participant list when real candidate records exist */}
          {participants.length > 0 ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Daftar Calon Peserta ({filteredParticipants.length})
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Data Riil Sistem
                </span>
              </div>

              {/* Search Box */}
              {participants.length > 3 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama atau NIK peserta..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {/* Participant cards list */}
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-0.5">
                {filteredParticipants.map((p) => (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCandidate(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedCandidate(p);
                      }
                    }}
                    className="p-2.5 rounded-xl border border-border/80 bg-white dark:bg-slate-900/90 hover:border-primary/50 hover:bg-primary/5 transition cursor-pointer flex flex-col gap-1.5 shadow-2xs group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                          {p.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {p.fullName}
                          </div>
                          <div className="text-[10.5px] font-mono text-muted-foreground tabular-nums">
                            NIK: {p.nik}
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 font-medium shrink-0",
                          p.readinessStatus === "Ready for Placement"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                        )}
                      >
                        {p.readinessStatus === "Ready for Placement" ? "Siap Kerja" : "Pelatihan"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <span className="truncate max-w-[190px]">
                        {p.institutionName || p.sourceType || "Vokasi Terdaftar"}
                      </span>
                      <span className="text-[10px] font-bold text-primary group-hover:underline flex items-center">
                        Lihat Profil ›
                      </span>
                    </div>
                  </div>
                ))}

                {filteredParticipants.length === 0 && (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    Tidak ditemukan peserta yang sesuai.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Funnel bars fallback for other non-candidate pillars */
            <div className="space-y-2 pt-1">
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
          )}

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

        {/* Candidate Detail Modal popup */}
        {selectedCandidate && (
          <CandidateDetailModal
            candidate={selectedCandidate}
            isOpen={Boolean(selectedCandidate)}
            onClose={() => setSelectedCandidate(null)}
          />
        )}
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
      <div className="p-3 border-b border-border bg-slate-50 dark:bg-slate-800 shrink-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Pilih {pillar.lv[levelIndex]?.toLowerCase() || "item"}
        </div>
        <div className="text-sm font-bold text-foreground flex items-center gap-2 mt-0.5">
          {levelIndex > 0 && (
            <button
              type="button"
              onClick={onBack}
              title="Kembali ke tingkat sebelumnya"
              className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs hover:bg-primary/20 transition cursor-pointer"
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
              role="button"
              tabIndex={0}
              onClick={(e) => onSelectChild(i, e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectChild(i, e.currentTarget);
                }
              }}
              className={cn(
                "relative grid grid-cols-[1fr_auto_14px] gap-2 items-center p-2 rounded-xl cursor-pointer transition-all group",
                isSelected
                  ? "bg-primary/15 font-semibold ring-1 ring-primary/40 shadow-xs"
                  : "hover:bg-muted/70 active:scale-[0.99]"
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
