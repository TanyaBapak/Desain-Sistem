import React, { useState } from 'react';
import { Modal } from './Modal';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  title?: string;
  entityName: string;
  entityId: string;
  description?: string;
  confirmText?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Penghapusan Data',
  entityName,
  entityId,
  description = 'Tindakan ini akan menghapus atau menonaktifkan data dari sistem dan tercatat dalam Audit Log nasional.',
  confirmText = 'Ya, Hapus Data',
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    const finalReason = reason.trim() || 'Penghapusan data melalui antarmuka pengguna Command Center';
    setSubmitting(true);
    try {
      await onConfirm(finalReason);
      setReason('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Verifikasi otorisasi dan alasan tindakan"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-foreground">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="text-xs">
            <span className="mb-0.5 block text-sm font-semibold">Peringatan tindakan kritis</span>
            <p className="leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <div className="mb-1 font-medium text-muted-foreground">Objek yang akan dihapus:</div>
          <div className="font-semibold text-foreground">{entityName}</div>
          <div className="mt-0.5 font-mono text-xs text-muted-foreground">ID: {entityId}</div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Alasan Justifikasi Penghapusan <span className="font-normal text-muted-foreground">(Wajib untuk Audit Log)</span>:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            placeholder="Contoh: Pembatalan kuota pemberi kerja / pengalihan data ganda / calon peserta mengundurkan diri..."
            className="w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow-sm transition hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{submitting ? 'Memproses...' : confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
