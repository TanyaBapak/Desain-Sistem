import React from "react";
import {
  resolveInstitutionSource,
  resolveInstitutionInputLevel,
  INSTITUTION_SOURCES,
  INSTITUTION_LEVELS,
} from "@/lib/institution-source";
import { cn } from "@/lib/utils";

interface InstitutionSourceBadgeProps {
  source?: string;
  sourceId?: string;
  level?: string;
  className?: string;
  showId?: boolean;
  showLevel?: boolean;
}

export function InstitutionSourceBadge({
  source,
  sourceId,
  level,
  className,
  showId = false,
  showLevel = false,
}: InstitutionSourceBadgeProps) {
  const resolvedSource = resolveInstitutionSource({
    registrationSource: source,
    id: sourceId,
  });
  const resolvedLevel = resolveInstitutionInputLevel({
    id: sourceId,
    registrationSource: source,
    inputLevel: level,
  });

  const meta = INSTITUTION_SOURCES[resolvedSource];
  const levelMeta = INSTITUTION_LEVELS[resolvedLevel];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border tabular-nums shrink-0",
        meta.badgeBg,
        meta.badgeBorder,
        meta.badgeText,
        className
      )}
      title={`${meta.label} (${levelMeta.label}): ${meta.desc}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{meta.shortLabel}</span>
      {showLevel && (
        <>
          <span className="opacity-40">•</span>
          <span className="font-medium opacity-90">{levelMeta.shortLabel}</span>
        </>
      )}
      {showId && sourceId && (
        <span className="opacity-75 font-mono text-[10px]">({sourceId})</span>
      )}
    </span>
  );
}

export function InstitutionLevelBadge({
  level,
  source,
  id,
  className,
}: {
  level?: string;
  source?: string;
  id?: string;
  className?: string;
}) {
  const resolvedLevel = resolveInstitutionInputLevel({
    id,
    registrationSource: source,
    inputLevel: level,
  });
  const meta = INSTITUTION_LEVELS[resolvedLevel];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border tabular-nums shrink-0",
        meta.badgeBg,
        meta.badgeBorder,
        meta.badgeText,
        className
      )}
      title={meta.desc}
    >
      <span>Level:</span>
      <strong className="font-semibold">{meta.shortLabel}</strong>
    </span>
  );
}
