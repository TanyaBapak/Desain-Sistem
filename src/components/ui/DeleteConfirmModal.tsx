import React, { useState } from 'react';
import { Modal } from './Modal';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
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

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason.trim() || 'Penghapusan data melalui antarmuka pengguna Command Center');
    setReason('');
    onClose();
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
        <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block text-sm mb-0.5">Peringatan Tindakan Kritis</span>
            <p className="leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
          <div className="text-slate-500 font-semibold mb-1">Objek yang akan dihapus:</div>
          <div className="font-bold text-slate-900 text-sm">{entityName}</div>
          <div className="font-mono text-slate-500 text-[11px] mt-0.5">ID: {entityId}</div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Alasan Justifikasi Penghapusan <span className="text-slate-400 font-normal">(Wajib untuk Audit Log)</span>:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Pembatalan kuota pemberi kerja / pengalihan data ganda / calon peserta mengundurkan diri..."
            className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
