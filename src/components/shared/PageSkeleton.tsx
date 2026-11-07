import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  activeTab?: string;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header & Breadcrumb Skeleton */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-7 w-64 rounded-lg" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      {/* KPI Stat Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl border border-border/60 bg-card space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-3 w-36 rounded" />
          </div>
        ))}
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="p-4 rounded-2xl border border-border/60 bg-card space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Skeleton className="h-10 w-full sm:flex-1 rounded-xl" />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-8 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Data Table Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
        {/* Table Header */}
        <div className="px-4 py-3.5 bg-muted/40 border-b border-border/60 flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-32 rounded hidden md:block" />
          <Skeleton className="h-4 w-24 rounded hidden lg:block" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border/40">
          {[1, 2, 3, 4, 5, 6, 7].map((row) => (
            <div key={row} className="px-4 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-[200px]">
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
              <div className="space-y-1.5 hidden sm:block">
                <Skeleton className="h-3.5 w-36 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <div className="flex gap-1.5 hidden md:flex">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <div className="space-y-1 hidden lg:block">
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-7 w-16 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
