import axios from 'axios';
import React, { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CandidateParticipant } from '../../types';
import {
  CandidateImportParseResult,
  downloadCandidateTemplate,
  downloadCandidateTemplateXlsx,
  parseCandidateSpreadsheet,
} from '../../lib/candidate-export';

interface CandidateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultInstitutionName?: string;
  defaultProvinsi?: string;
  defaultKabupatenKota?: string;
  defaultSourceType?: CandidateParticipant['sourceType'];
}

export const CandidateImportModal: React.FC<CandidateImportModalProps> = ({
  isOpen,
  onClose,
  defaultInstitutionName = 'Lembaga Vokasi',
  defaultProvinsi = 'Jawa Tengah',
  defaultKabupatenKota = 'Kota Surakarta',
  defaultSourceType = 'Lembaga Vokasi',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [parseResult, setParseResult] = useState<CandidateImportParseResult | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFileName('');
    setParseResult(null);
    setIsParsing(false);
    setIsSubmitting(false);
    setImportProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetState();
    onClose();
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls') && !ext.endsWith('.csv')) {
      toast.error('Format berkas tidak didukung. Unggah berkas .XLSX, .XLS, atau .CSV.');
      return;
    }

    setSelectedFileName(file.name);
    setIsParsing(true);
    try {
      const result = await parseCandidateSpreadsheet(file, {
        institutionName: defaultInstitutionName,
        provinsi: defaultProvinsi,
        kabupatenKota: defaultKabupatenKota,
        sourceType: defaultSourceType,
      });
      setParseResult(result);
      if (result.validRows.length === 0 && result.errors.length === 0) {
        toast.warning('Berkas tidak berisi baris data calon PMI. Pastikan baris diisi di bawah judul kolom.');
      } else if (result.validRows.length > 0) {
        toast.success(`Berhasil membaca ${result.validRows.length} baris data calon PMI.`);
      }
    } catch {
      toast.error('Berkas gagal dibaca. Pastikan berkas menggunakan format Template Pengumpulan (.XLSX / .CSV).');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmitImport = async () => {
    if (!parseResult || parseResult.validRows.length === 0) return;

    const rows = parseResult.validRows;
    const total = rows.length;
    const CHUNK_SIZE = 350; // Aman untuk batas server maupun konfigurasi lama (< 500 baris)

    setIsSubmitting(true);
    setImportProgress({ current: 0, total });

    try {
      if (total <= CHUNK_SIZE) {
        // Berkas kecil (<= 350): kirim langsung via router.post
        router.post(
          '/business-data/candidates/import',
          { candidates: rows as unknown as Record<string, string>[] },
          {
            preserveScroll: true,
            onSuccess: () => {
              toast.success(`${total} data calon PMI berhasil diunggah dan disimpan.`);
              resetState();
              onClose();
            },
            onError: (errors: Record<string, string>) => {
              const firstMsg = Object.values(errors).find(Boolean);
              toast.error(firstMsg ?? 'Gagal mengimpor data calon PMI. Periksa kembali format data wilayah dan NIK.');
            },
            onFinish: () => {
              setIsSubmitting(false);
              setImportProgress(null);
            },
          }
        );
        return;
      }

      // Berkas besar (1.000 - 10.000+ data): kirim secara bertahap (chunking)
      let importedTotal = 0;
      for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        setImportProgress({ current: i, total });

        await axios.post(
          '/business-data/candidates/import',
          { candidates: chunk },
          {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        importedTotal += chunk.length;
        setImportProgress({ current: importedTotal, total });
      }

      toast.success(`Berhasil mengimpor seluruh ${importedTotal} data calon PMI ke database.`);
      resetState();
      onClose();
      router.reload();
    } catch (err: unknown) {
      const errorMsg =
        (err as any)?.response?.data?.message ||
        (err as any)?.response?.data?.errors?.candidates?.[0] ||
        'Gagal mengimpor data calon PMI. Periksa koneksi atau format berkas.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
      setImportProgress(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="relative my-8 w-full max-w-3xl rounded-2xl border border-border bg-background p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="import-modal-title" className="text-lg font-semibold text-foreground">
                Unggah Data Calon PMI (.XLSX / .CSV)
              </h2>
              <p className="text-xs text-muted-foreground">
                Impor massal data pencari kerja dari berkas Template Pengumpulan Excel atau CSV.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup dialog unggah"
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-4">
          {/* Template Shortcut Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs">
            <span className="text-muted-foreground">
              Belum memiliki format berkas? Unduh template resmi terlebih dahulu:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadCandidateTemplateXlsx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 font-semibold text-foreground transition hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Template (.XLSX)</span>
              </button>
              <button
                type="button"
                onClick={downloadCandidateTemplate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 font-semibold text-foreground transition hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Template (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Dropzone / File Input */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleFileSelected(e.dataTransfer.files?.[0]);
            }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center transition hover:border-primary/50"
          >
            <FileSpreadsheet className="h-9 w-9 text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-foreground">
              {selectedFileName ? `Berkas terpilih: ${selectedFileName}` : 'Pilih atau seret berkas Excel (.XLSX) / CSV ke area ini'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mendukung deteksi otomatis kolom template, validasi 16 digit NIK, dan pemeriksaan duplikat.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => void handleFileSelected(e.target.files?.[0])}
              className="hidden"
              id="candidate-spreadsheet-upload"
            />
            <label
              htmlFor="candidate-spreadsheet-upload"
              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{selectedFileName ? 'Ganti Berkas' : 'Pilih Berkas (.XLSX / .CSV)'}</span>
            </label>
          </div>

          {isParsing && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Memproses dan memvalidasi isi berkas...</span>
            </div>
          )}

          {/* Parse Summary & Preview */}
          {parseResult && !isParsing && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <span className="text-xs text-muted-foreground">Baris Siap Diimpor</span>
                  <div className="mt-1 flex items-center gap-1.5 text-lg font-bold tabular-nums text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{parseResult.validRows.length} Calon PMI</span>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <span className="text-xs text-muted-foreground">Baris Bermasalah / Dilewati</span>
                  <div className="mt-1 flex items-center gap-1.5 text-lg font-bold tabular-nums text-foreground">
                    <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
                    <span>{parseResult.errors.length} Baris</span>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <span className="text-xs text-muted-foreground">Duplikat NIK di Berkas</span>
                  <div className="mt-1 text-lg font-bold tabular-nums text-foreground">
                    {parseResult.duplicateCount} Duplikat
                  </div>
                </div>
              </div>

              {parseResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs">
                  <p className="font-semibold text-destructive">Laporan Baris Bermasalah:</p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {parseResult.errors.slice(0, 10).map((err) => (
                      <li key={`${err.rowNumber}-${err.fullName}`}>
                        <strong>Baris {err.rowNumber}</strong> ({err.fullName}): {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parseResult.validRows.length > 0 && (
                <div className="max-h-52 overflow-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Nama Lengkap</th>
                        <th className="px-3 py-2">Pendidikan & Jurusan</th>
                        <th className="px-3 py-2">Wilayah</th>
                        <th className="px-3 py-2">Negara & Jabatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parseResult.validRows.slice(0, 15).map((row, idx) => (
                        <tr key={`${row.nik}-${idx}`}>
                          <td className="px-3 py-2 font-medium text-foreground">
                            {row.fullName}
                            <span className="block font-mono text-[11px] text-muted-foreground">{row.nik}</span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {row.educationLevel} — {row.major}
                            <span className="block text-[11px]">{row.institutionName}</span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {row.kabupatenKota}, {row.provinsi}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {row.preferredCountry.join(', ')} · {row.preferredJobRole.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmitImport}
            disabled={!parseResult || parseResult.validRows.length === 0 || isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>
                  {importProgress
                    ? `Menyimpan ${importProgress.current} / ${importProgress.total} (${Math.round((importProgress.current / importProgress.total) * 100)}%)...`
                    : 'Mengunggah...'}
                </span>
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Simpan Hasil Unggahan ({parseResult?.validRows.length ?? 0})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

