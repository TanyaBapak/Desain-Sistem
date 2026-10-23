export const API_CONFIG = {
  // Base URL untuk SIPPMI (Laravel) - monitoring tahap 4-6 / LPK
  sippmiBase: import.meta.env.VITE_SIPPMI_API_BASE || 'http://gardata.sippmi.com',
  // Base URL untuk aplikasi ini (p2mi.sippmi.com)
  appBase: import.meta.env.VITE_APP_URL || 'https://p2mi.sippmi.com',
  // Endpoint placement di SIPPMI
  placement: {
    summary: '/api/v1/placement/summary',
    classes: '/api/v1/placement/classes',
    candidates: '/api/v1/placement/candidates',
    candidateDetail: (id: string | number) => `/api/v1/placement/candidates/${id}`,
    classDetail: (id: string | number) => `/api/v1/placement/classes/${id}`,
    exportBatch: '/api/v1/placement/export-batch',
  },
} as const;
