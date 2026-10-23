"use client";

import { toast as sonnerToast } from "sonner";

function toast(message: string | React.ReactNode, options?: any) {
  return sonnerToast(message as any, options);
}

Object.assign(toast, {
  success: sonnerToast.success,
  error: sonnerToast.error,
});

export function useToast() {
  return {
    toast,
    toasts: [],
  };
}

export type Toast = { id: string | number };
