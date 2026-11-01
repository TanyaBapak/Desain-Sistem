#!/usr/bin/env bash
# ==============================================================================
# Skrip Backup Database Harian SMK Go Global
# Otomatis melakukan backup harian (gzip) dan menghapus arsip > 3 hari.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

cd "$BACKEND_DIR"

# Jalankan command artisan db:backup dengan retensi 3 hari
php artisan db:backup --days=3 "$@"
