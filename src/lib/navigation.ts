import { router } from "@inertiajs/react";

export function visitAppTab(tab: string): void {
  router.visit(`/app/${encodeURIComponent(tab)}`);
}

export function visitPath(path: string): void {
  router.visit(path);
}
