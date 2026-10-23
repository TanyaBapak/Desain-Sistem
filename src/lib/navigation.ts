import { router } from "@inertiajs/react";

export function visitAppTab(tab: string): void {
  router.visit(`/app/${encodeURIComponent(tab)}`);
}

export function visitPath(path: string): void {
  router.visit(path);
}

export function visitAllocationStage(selection: {
  programId?: string;
  providerId?: string;
}): void {
  const params = new URLSearchParams({ stage: "4" });
  if (selection.programId) params.set("programId", selection.programId);
  if (selection.providerId) params.set("providerId", selection.providerId);

  router.visit(`/app/matching?${params.toString()}`);
}
