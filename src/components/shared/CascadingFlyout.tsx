import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  PILLARS_DATA,
  PillarKey,
  TreeNode,
  MetricSpec,
  formatNum,
} from "@/components/shared/CascadingFlyoutData";
import { PanelContent } from "@/components/shared/CascadingFlyoutPanel";
import { cn } from "@/lib/utils";
import {
  Users,
  GraduationCap,
  Building2,
  Globe2,
  ChevronRight,
} from "lucide-react";

const FOUR_COUNTRIES = ["Jepang", "Korea Selatan", "Malaysia", "Turki"];

interface CascadingFlyoutProps {
  className?: string;
  vokasiSupplyCount?: number;
  onOpenDrilldownModal?: (pillar: PillarKey, pathName?: string) => void;
}

export function CascadingFlyout({ className, vokasiSupplyCount, onOpenDrilldownModal }: CascadingFlyoutProps) {
  const [curPillar, setCurPillar] = useState<PillarKey | null>(null);
  const [path, setPath] = useState<number[]>([]);
  const [metricKey, setMetricKey] = useState<keyof MetricSpec>("a");
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [anchors, setAnchors] = useState<{ left: number; top: number; right: number; bottom: number }[]>([]);

  const cardRefs = useRef<Record<PillarKey, HTMLButtonElement | null>>({
    sup: null,
    pel: null,
    lpk: null,
    dem: null,
  });

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const closeAll = useCallback(() => {
    setCurPillar(null);
    setPath([]);
    setAnchors([]);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && curPillar !== null) {
        if (path.length > 0) {
          setPath((prev) => prev.slice(0, -1));
          setAnchors((prev) => prev.slice(0, -1));
        } else {
          closeAll();
        }
      }
    },
    [curPillar, path.length, closeAll]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleCardClick = (k: PillarKey, el: HTMLButtonElement) => {
    if (curPillar === k) {
      closeAll();
      return;
    }
    const rect = el.getBoundingClientRect();
    setCurPillar(k);
    setPath([]);
    setMetricKey("a");
    setAnchors([{ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }]);
  };

  const handleItemSelect = (levelIndex: number, childIndex: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const newPath = path.slice(0, levelIndex);
    newPath.push(childIndex);
    setPath(newPath);

    const newAnchors = anchors.slice(0, levelIndex + 1);
    newAnchors[levelIndex + 1] = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    setAnchors(newAnchors);
  };

  const handleItemHover = (levelIndex: number, childIndex: number, el: HTMLElement) => {
    if (isMobile) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      if (path[levelIndex] !== childIndex || path.length > levelIndex + 1) {
        handleItemSelect(levelIndex, childIndex, el);
      }
    }, 110);
  };

  const activePillarConfig = curPillar ? PILLARS_DATA[curPillar] : null;

  const currentNodes: TreeNode[] = [];
  if (activePillarConfig) {
    currentNodes.push(activePillarConfig.root);
    let curr = activePillarConfig.root;
    for (const idx of path) {
      if ("ch" in curr && curr.ch[idx]) {
        currentNodes.push(curr.ch[idx]);
        curr = curr.ch[idx] as typeof activePillarConfig.root;
      }
    }
  }

  // Compute sliding-window positions for cascading panels:
  // Panels always cascade to the right (Card -> Panel 0 -> Panel 1 -> Panel 2...).
  // When the latest panel would exceed the right screen edge, all panels shift smoothly
  // to the left so that the latest panel always stays visible on the right.
  const panelPositions = React.useMemo(() => {
    if (isMobile || !anchors.length || !currentNodes.length) return [];
    const PANEL_WIDTH = 330;
    const GAP = 8;
    const PADDING = 16;
    const PANEL_HEIGHT = 520;
    const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winH = typeof window !== "undefined" ? window.innerHeight : 800;

    const card = anchors[0];
    const n = currentNodes.length;

    // Base position for panel 0:
    // Starts aligned with card's left (or clamped to screen bounds)
    const baseX = Math.max(PADDING, card.left);

    // Calculate unshifted right-cascading positions:
    // Panel k is at baseX + k * (PANEL_WIDTH + GAP)
    const rawLefts: number[] = [];
    for (let k = 0; k < n; k++) {
      rawLefts.push(baseX + k * (PANEL_WIDTH + GAP));
    }

    // Check right edge of the latest panel (n - 1)
    const maxAllowedRight = winW - PADDING;
    const latestRightEdge = rawLefts[n - 1] + PANEL_WIDTH;
    const overflow = Math.max(0, latestRightEdge - maxAllowedRight);

    // If overflow > 0, shift ALL panels to the left by `overflow`
    // This allows popups to keep opening to the right while earlier popups slide left
    const shiftedPositions: { left: number; top: number }[] = [];

    // Consistent top alignment across the cascading chain to avoid vertical jitter
    const top = Math.max(PADDING, Math.min(card.top, winH - PANEL_HEIGHT - PADDING));

    for (let k = 0; k < n; k++) {
      const left = rawLefts[k] - overflow;
      shiftedPositions.push({ left, top });
    }

    return shiftedPositions;
  }, [anchors, currentNodes.length, isMobile]);

  const siapLatihCount = PILLARS_DATA.sup.root.m.a;
  const resolvedVokasiSupply =
    typeof vokasiSupplyCount === "number" && vokasiSupplyCount > 0
      ? vokasiSupplyCount
      : PILLARS_DATA.lpk.root.m.a;

  return (
    <div className={cn("relative select-none", className)}>
      {/* Connector lines between cards (Desktop) */}
      {/* Top Row Connector Arrow: Card 1 -> Card 2 */}
      <div className="hidden md:flex absolute top-[24%] left-[48%] -translate-x-1/2 -translate-y-1/2 items-center justify-center z-20 pointer-events-none">
        <div className="flex items-center gap-1 bg-slate-900/95 border border-cyan-500/40 px-2 py-0.5 rounded-full shadow-lg shadow-cyan-950/60 text-cyan-400 text-[10px] font-extrabold">
          <span className="animate-pulse">---▶</span>
        </div>
      </div>

      {/* S-curve connector badge: Card 2 (top-right) -> Card 3 (bottom-left) */}
      <div className="hidden md:flex absolute top-[50%] left-[48%] -translate-x-1/2 -translate-y-1/2 items-center justify-center z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-900/95 border border-slate-700/80 px-2.5 py-0.5 rounded-full text-slate-300 text-[9px] font-semibold shadow-md">
          <span className="text-cyan-400 font-bold">↺</span> Standardisasi ke Fasilitas
        </div>
      </div>

      {/* Bottom Row Connector Arrow: Card 3 -> Card 4 */}
      <div className="hidden md:flex absolute top-[76%] left-[48%] -translate-x-1/2 -translate-y-1/2 items-center justify-center z-20 pointer-events-none">
        <div className="flex items-center gap-1 bg-slate-900/95 border border-purple-500/40 px-2 py-0.5 rounded-full shadow-lg shadow-purple-950/60 text-purple-400 text-[10px] font-extrabold">
          <span className="animate-pulse">---▶</span>
        </div>
      </div>

      {/* Unified 2x2 Grid of 4 Cards (Hero + Command Center Flyout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-0">
        {/* 1. Siap Latih (Top-Left) */}
        <button
          ref={(el) => {
            cardRefs.current.sup = el;
          }}
          type="button"
          onClick={(e) => handleCardClick("sup", e.currentTarget)}
          className={cn(
            "group relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-300 cursor-pointer bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-900/95",
            curPillar === "sup"
              ? "border-cyan-400 shadow-xl shadow-cyan-900/30 ring-2 ring-cyan-400/40"
              : "border-cyan-500/30 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-900/20"
          )}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                1. Siap Latih
              </h4>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-inner">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
                {formatNum(siapLatihCount)}
                <span className="text-xs text-cyan-400 font-semibold ml-2">Peserta</span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Peserta Siap Latih
              </p>
            </div>
          </div>

          <div className="w-full pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-cyan-300 mt-2">
            <span>Jelajahi Data Siap Latih</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* 2. Siap Program (Top-Right) */}
        <button
          ref={(el) => {
            cardRefs.current.pel = el;
          }}
          type="button"
          onClick={(e) => handleCardClick("pel", e.currentTarget)}
          className={cn(
            "group relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-300 cursor-pointer bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-900/95",
            curPillar === "pel"
              ? "border-amber-400 shadow-xl shadow-amber-900/30 ring-2 ring-amber-400/40"
              : "border-amber-500/30 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-900/20"
          )}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">
                2. Siap Program
              </h4>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
                4 Negara
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Jenis Program Pelatihan per Sektor Negara
              </p>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {FOUR_COUNTRIES.map((country) => (
                <span
                  key={country}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold"
                >
                  {country}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-amber-300 mt-3">
            <span>Pilih Negara & Lihat Sektor</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* 3. Siap Vokasi (Bottom-Left) */}
        <button
          ref={(el) => {
            cardRefs.current.lpk = el;
          }}
          type="button"
          onClick={(e) => handleCardClick("lpk", e.currentTarget)}
          className={cn(
            "group relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-300 cursor-pointer bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-900/95",
            curPillar === "lpk"
              ? "border-emerald-400 shadow-xl shadow-emerald-900/30 ring-2 ring-emerald-400/40"
              : "border-emerald-500/30 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/20"
          )}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                3. Siap Vokasi
              </h4>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
                {formatNum(resolvedVokasiSupply)}
                <span className="text-xs text-emerald-400 font-semibold ml-2">Vokasi</span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Jumlah Vokasi dari Siap Latih yang Sudah Terdata
              </p>
            </div>
          </div>

          <div className="w-full pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-emerald-300 mt-2">
            <span>Jelajahi Vokasi Suplai</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* 4. Siap Permintaan (Bottom-Right) */}
        <button
          ref={(el) => {
            cardRefs.current.dem = el;
          }}
          type="button"
          onClick={(e) => handleCardClick("dem", e.currentTarget)}
          className={cn(
            "group relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-slate-900/95",
            curPillar === "dem"
              ? "border-purple-400 shadow-xl shadow-purple-900/30 ring-2 ring-purple-400/40"
              : "border-purple-500/30 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-900/20"
          )}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-extrabold text-white group-hover:text-purple-300 transition-colors">
                4. Siap Permintaan
              </h4>
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-inner">
                <Globe2 className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
                4 Negara
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Permintaan dari 4 Negara Tujuan
              </p>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {FOUR_COUNTRIES.map((country) => (
                <span
                  key={country}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-bold"
                >
                  {country}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-purple-300 mt-3">
            <span>Jelajahi Permintaan 4 Negara</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Flyout Layer Backdrop and Panels */}
      {curPillar && activePillarConfig && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-[1px]"
            onClick={closeAll}
          />

          {/* Panels Container */}
          {isMobile ? (
            // Mobile: Bottom Sheet with single active level
            <div className="fixed bottom-0 left-0 right-0 z-60 bg-white dark:bg-slate-900 border-t border-border rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
              <PanelContent
                levelIndex={currentNodes.length - 1}
                node={currentNodes[currentNodes.length - 1]}
                pillar={activePillarConfig}
                metricKey={metricKey}
                selectedChildIndex={path[currentNodes.length - 1]}
                onSelectChild={(childIdx, el) => handleItemSelect(currentNodes.length - 1, childIdx, el)}
                onHoverChild={() => {}}
                onBack={() => {
                  if (path.length === 0) closeAll();
                  else {
                    setPath((prev) => prev.slice(0, -1));
                    setAnchors((prev) => prev.slice(0, -1));
                  }
                }}
                onSetMetric={setMetricKey}
                onOpenFullModal={() => {
                  const targetPillar = curPillar;
                  closeAll();
                  onOpenDrilldownModal?.(targetPillar);
                }}
                isMobile={true}
              />
            </div>
          ) : (
            // Desktop: Cascading Panels with sliding window (shift left as deep columns open to the right)
            currentNodes.map((node, k) => {
              const pos = panelPositions[k] ?? { left: 100, top: 100 };

              return (
                <div
                  key={`${curPillar}-${k}`}
                  style={{
                    left: `${pos.left}px`,
                    top: `${pos.top}px`,
                    zIndex: 60 + k,
                    transition: "left 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease",
                  }}
                  className="fixed w-[330px] max-h-[min(74vh,540px)] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 duration-150"
                >
                  <PanelContent
                    levelIndex={k}
                    node={node}
                    pillar={activePillarConfig}
                    metricKey={metricKey}
                    selectedChildIndex={path[k]}
                    onSelectChild={(childIdx, el) => handleItemSelect(k, childIdx, el)}
                    onHoverChild={() => {}}
                    onBack={() => {
                      if (path.length > 0) {
                        setPath((prev) => prev.slice(0, -1));
                        setAnchors((prev) => prev.slice(0, -1));
                      } else {
                        closeAll();
                      }
                    }}
                    onSetMetric={setMetricKey}
                    onOpenFullModal={() => {
                      const targetPillar = curPillar;
                      closeAll();
                      onOpenDrilldownModal?.(targetPillar);
                    }}
                    isMobile={false}
                  />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
