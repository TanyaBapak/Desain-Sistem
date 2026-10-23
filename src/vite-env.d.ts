/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SIPPMI_API_BASE: string;
  readonly VITE_API_BASE: string;
  readonly VITE_APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
