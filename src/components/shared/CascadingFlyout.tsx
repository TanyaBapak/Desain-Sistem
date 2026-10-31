import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  PILLARS_DATA,
  PillarKey,
  PillarConfig,
  TreeNode,
  MetricSpec,
  formatNum,
} from "@/components/shared/CascadingFlyoutData";
import { PanelContent } from "@/components/shared/CascadingFlyoutPanel";
import { cn } from "@/lib/utils";

interface CascadingFlyoutProps {
  className?: string;
  onOpenDrilldownModal?: (pillar: PillarKey, pathName?: string) => void;
}

export function CascadingFlyout({ className, onOpenDrilldownModal }: CascadingFlyoutProps) {
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

  // Compute adaptive positions for cascading panels to prevent stacking on right edge
  const panelPositions = React.useMemo(() => {
    if (isMobile || !anchors.length || !currentNodes.length) return [];
    const PANEL_WIDTH = 300;
    const GAP = 8;
    const PADDING = 16;
    const PANEL_HEIGHT = 480;
    const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winH = typeof window !== "undefined" ? window.innerHeight : 800;

    const card = anchors[0];
    // If the card center is in the right half of the screen, cascade LEFT; otherwise RIGHT
    const cascadeLeft = (card.left + card.right) / 2 > winW / 2;

    const positions: { left: number; top: number }[] = [];

    for (let k = 0; k < currentNodes.length; k++) {
      let left: number;
      if (k === 0) {
        if (cascadeLeft) {
          // Cascade towards left of card
          if (card.left - PANEL_WIDTH - GAP >= PADDING) {
            left = card.left - PANEL_WIDTH - GAP;
          } else {
            left = Math.max(PADDING, card.right - PANEL_WIDTH);
          }
        } else {
          // Cascade towards right of card
          if (card.right + PANEL_WIDTH + GAP <= winW - PADDING) {
            left = card.right + GAP;
          } else {
            left = Math.max(PADDING, card.left - PANEL_WIDTH - GAP);
          }
        }
      } else {
        const prev = positions[k - 1];
        if (cascadeLeft) {
          left = prev.left - PANEL_WIDTH - GAP;
          if (left < PADDING) {
            // If overflowed to the left screen edge, try to position to the right of panel 0
            const rightOfPanel0 = positions[0].left + PANEL_WIDTH + GAP;
            if (rightOfPanel0 + PANEL_WIDTH <= winW - PADDING) {
              left = rightOfPanel0;
            } else {
              left = PADDING;
            }
          }
        } else {
          left = prev.left + PANEL_WIDTH + GAP;
          if (left + PANEL_WIDTH > winW - PADDING) {
            // If overflowed to the right screen edge, try to position to the left of panel 0
            const leftOfPanel0 = positions[0].left - PANEL_WIDTH - GAP;
            if (leftOfPanel0 >= PADDING) {
              left = leftOfPanel0;
            } else {
              left = Math.max(PADDING, winW - PANEL_WIDTH - PADDING);
            }
          }
        }
      }

      const anchor = anchors[k] || card;
      const top = Math.max(PADDING, Math.min(anchor.top, winH - PANEL_HEIGHT - PADDING));

      positions.push({ left, top });
    }

    return positions;
  }, [anchors, currentNodes.length, isMobile]);

  return (
    <div className={cn("space-y-4 select-none", className)}>
      {/* 4 Pillar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(PILLARS_DATA) as [PillarKey, PillarConfig][]).map(([k, p]) => {
          const isActive = curPillar === k;
          return (
            <button
              key={k}
              ref={(el) => {
                cardRefs.current[k] = el;
              }}
              type="button"
              onClick={(e) => handleCardClick(k, e.currentTarget)}
              className={cn(
                "p-4 rounded-2xl text-left border-2 transition-all duration-150 cursor-pointer bg-card shadow-xs group",
                isActive
                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md scale-[1.01]"
                  : "border-border hover:border-primary/60 hover:-translate-y-0.5"
              )}
            >
              <small className="text-xs font-semibold text-muted-foreground block">{p.t}</small>
              <b className="block text-2xl sm:text-3xl font-extrabold text-foreground mt-0.5 tabular-nums">
                {formatNum(p.root.m.a)}
              </b>
              <small className="text-[11.5px] text-muted-foreground block mt-1 line-clamp-1">
                {p.k[0][1].toLowerCase()} · {p.root.ch.length} {p.lv[0].toLowerCase()}
              </small>
              <div className="flex items-center justify-between text-xs font-semibold text-primary mt-3 pt-2 border-t border-border/50">
                <span>Jelajahi Data</span>
                <span className="group-hover:translate-x-1 transition-transform">›</span>
              </div>
            </button>
          );
        })}
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
            <div className="fixed bottom-0 left-0 right-0 z-60 bg-card border-t border-border rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
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
                onOpenFullModal={() => onOpenDrilldownModal?.(curPillar)}
                isMobile={true}
              />
            </div>
          ) : (
            // Desktop: Cascading Panels with intelligent direction (Left or Right)
            currentNodes.map((node, k) => {
              const pos = panelPositions[k] ?? { left: 100, top: 100 };

              return (
                <div
                  key={`${curPillar}-${k}`}
                  style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
                  className="fixed z-60 w-[300px] max-h-[min(70vh,520px)] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 duration-150"
                >
                  <PanelContent
                    levelIndex={k}
                    node={node}
                    pillar={activePillarConfig}
                    metricKey={metricKey}
                    selectedChildIndex={path[k]}
                    onSelectChild={(childIdx, el) => handleItemSelect(k, childIdx, el)}
                    onHoverChild={(childIdx, el) => handleItemHover(k, childIdx, el)}
                    onBack={() => {}}
                    onSetMetric={setMetricKey}
                    onOpenFullModal={() => onOpenDrilldownModal?.(curPillar)}
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
