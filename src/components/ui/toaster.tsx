"use client";

import { Toaster as SonnerToaster } from "sonner";
import "sonner/dist/styles.css";

export const Toaster = () => {
  return <SonnerToaster position="top-right" richColors className="z-[100]" />;
};
