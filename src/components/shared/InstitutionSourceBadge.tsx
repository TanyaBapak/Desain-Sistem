import React from "react";
import {
  resolveInstitutionSource,
  INSTITUTION_SOURCES,
} from "@/lib/institution-source";
import { cn } from "@/lib/utils";

interface InstitutionSourceBadgeProps {
  source?: string;
  sourceId?: string;
  className?: string;
  showId?: boolean;
}

export function InstitutionSourceBadge({
  source,
  sourceId,
  className,
  showId = false,
}: InstitutionSourceBadgeProps) {
  const resolvedKey = resolveInstitutionSource({
    registrationSource: source,
    id: sourceId,
  });
  const meta = INSTITUTION_SOURCES[resolvedKey];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border tabular-nums shrink-0",
        meta.badgeBg,
        meta.badgeBorder,
        meta.badgeText,
        className
      )}
      title={`${meta.label}: ${meta.desc}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{meta.shortLabel}</span>
      {showId && sourceId && (
        <span className="opacity-75 font-mono text-[10px]">({sourceId})</span>
      )}
    </span>
  );
}
