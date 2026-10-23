import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  XCircle,
  FileText,
  UserCheck,
  Building2,
  Globe2,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Check,
  X
} from 'lucide-react';
import { DataApprovalRequest, ApprovalEntityType } from '../../types';

interface ApprovalWorkflowViewProps {
  approvalRequests: DataApprovalRequest[];
  canReview: boolean;
}

export const ApprovalWorkflowView: React.FC<ApprovalWorkflowViewProps> = ({ approvalRequests, canReview }) => {

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Action Notes
  const [activeModal, setActiveModal] = useState<{
    type: 'approve' | 'reject' | 'revision';
    request: DataApprovalRequest;
  } | null>(null);
  const [modalNotes, setModalNotes] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredRequests = approvalRequests.filter((req) => {
    if (filterStatus !== 'ALL' && req.approvalStatus !== filterStatus) return false;
    if (filterType !== 'ALL' && req.entityType !== filterType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = req.title.toLowerCase().includes(q);
      const matchBy = req.submittedBy.toLowerCase().includes(q);
      const matchScope = req.scopeLabel.toLowerCase().includes(q);
      if (!matchTitle && !matchBy && !matchScope) return false;
    }
    return true;
  });

  const countPending = approvalRequests.filter((r) => r.approvalStatus === 'PENDING').length;
  const countApproved = approvalRequests.filter((r) => r.approvalStatus === 'APPROVED').length;
  const countRevision = approvalRequests.filter((r) => r.approvalStatus === 'REVISION_REQUESTED').length;
  const countRejected = approvalRequests.filter((r) => r.approvalStatus === 'REJECTED').length;

  const handleConfirmAction = () => {
    if (!activeModal) return;
    if (activeModal.type !== 'approve' && !modalNotes.trim()) {
      setActionError(activeModal.type === 'reject'
        ? 'Alasan penolakan wajib diisi.'
        : 'Catatan revisi wajib diisi.');
      return;
    }

    setSubmitting(true);
    setActionError('');
    router.post(`/approvals/${encodeURIComponent(activeModal.request.id)}`, {
      action: activeModal.type,
      notes: modalNotes,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Keputusan verifikasi berhasil disimpan.');
        setActiveModal(null);
        setModalNotes('');
      },
      onError: (errors) => {
        const message = Object.values(errors).find(Boolean);
        setActionError(message ?? 'Keputusan belum dapat disimpan. Periksa hak akses dan status usulan.');
        toast.error(message ?? 'Keputusan verifikasi gagal disimpan.');
      },
      onFinish: () => setSubmitting(false),
    });
  };

  const getEntityIcon = (type: ApprovalEntityType) => {
    switch (type) {
      case 'calon_peserta':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'lembaga_vokasi':
        return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'demand_luar_negeri':
        return <Globe2 className="w-4 h-4 text-cyan-600" />;
      case 'program_pelatihan':
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Five-Stage Visual Workflow Stepper matching Section 3 */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
              STANDARD OPERATING PROCEDURE (SOP) INTEGRITAS DATA
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Alur Persetujuan & Validasi Data Berjenjang
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menjamin setiap baris data yang masuk ke basis data teruji keabsahannya sebelum digunakan untuk pencocokan (matching) dan monitoring pimpinan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>{countPending} Antrean Membutuhkan Tindakan</span>
            </span>
          </div>
        </div>

        {/* 5-Step Pipeline Card Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {/* Step 1 */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-blue-600 block">TAHAP 1</span>
              <h4 className="font-extrabold text-slate-900 mt-0.5">Operator / Stakeholder</h4>
              <p className="text-[11px] text-slate-500 mt-1">Input data calon peserta, profil lembaga, atau kuota demand.</p>
            </div>
            <div className="mt-2 text-[10px] text-blue-700 font-bold">Disnaker / SMK / Mitra LN</div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-purple-600 block">TAHAP 2</span>
              <h4 className="font-extrabold text-slate-900 mt-0.5">Validasi Otomatis</h4>
              <p className="text-[11px] text-slate-500 mt-1">Format NIK Dukcapil, anti-duplikasi, kolom wajib, & konsistensi data.</p>
            </div>
            <div className="mt-2 text-[10px] text-purple-700 font-bold">Engine Validasi AI & API</div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs flex flex-col justify-between ring-2 ring-rose-400">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-rose-600 block">TAHAP 3 (AKTIF)</span>
              <h4 className="font-extrabold text-slate-900 mt-0.5">Verifikator Berwenang</h4>
              <p className="text-[11px] text-slate-500 mt-1">Setujui, tolak dengan alasan, atau kembalikan untuk revisi berkas.</p>
            </div>
            <div className="mt-2 text-[10px] text-rose-700 font-bold">Tim Verifikator & Task Force</div>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 block">TAHAP 4</span>
              <h4 className="font-extrabold text-slate-900 mt-0.5">Data Terverifikasi</h4>
              <p className="text-[11px] text-slate-500 mt-1">Masuk ke data warehouse nasional siap komputasi smart matching.</p>
            </div>
            <div className="mt-2 text-[10px] text-emerald-700 font-bold">Database Nasional SGG-CC</div>
          </div>

          {/* Step 5 */}
          <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-300 text-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-600 block">TAHAP 5</span>
              <h4 className="font-extrabold text-slate-900 mt-0.5">Dashboard Pimpinan</h4>
              <p className="text-[11px] text-slate-500 mt-1">Penyajian capaian agregat nasional, kesenjangan supply-demand, & intervensi.</p>
            </div>
            <div className="mt-2 text-[10px] text-slate-700 font-bold">Menteri, Wamen & Dirjen</div>
          </div>
        </div>
      </div>

      {/* 2. Filters & Status Badges */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan usulan, nama pengusul, atau wilayah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Jenis Entitas</option>
              <option value="calon_peserta">Calon Peserta</option>
              <option value="lembaga_vokasi">Lembaga Vokasi</option>
              <option value="demand_luar_negeri">Demand Luar Negeri</option>
              <option value="program_pelatihan">Program Pelatihan</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({approvalRequests.length})
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Verifikasi ({countPending})</span>
          </button>
          <button
            onClick={() => setFilterStatus('APPROVED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Disetujui ({countApproved})</span>
          </button>
          <button
            onClick={() => setFilterStatus('REVISION_REQUESTED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'REVISION_REQUESTED'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Perlu Revisi ({countRevision})</span>
          </button>
          <button
            onClick={() => setFilterStatus('REJECTED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak ({countRejected})</span>
          </button>
        </div>
      </div>

      {/* 3. Requests Feed List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="font-extrabold text-slate-800 text-base">Tidak Ada Usulan yang Sesuai Filter</h4>
            <p className="text-xs text-slate-400 mt-1">Semua antrean pada filter ini telah ditindaklanjuti.</p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`bg-white rounded-2xl p-5 border transition-all duration-200 shadow-xs hover:shadow-md ${
                req.approvalStatus === 'PENDING'
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : req.approvalStatus === 'APPROVED'
                  ? 'border-emerald-200'
                  : req.approvalStatus === 'REVISION_REQUESTED'
                  ? 'border-purple-200'
                  : 'border-rose-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left: Info & Details */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2 py-0.5 rounded-md font-extrabold bg-slate-100 text-slate-700 flex items-center gap-1">
                      {getEntityIcon(req.entityType)}
                      <span className="capitalize">{req.entityType.replace('_', ' ')}</span>
                    </span>
                    <span className="font-mono text-slate-400">#{req.id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{req.submittedAt}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-slate-700">{req.scopeLabel}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">
                    {req.title}
                  </h3>

                  <p className="text-xs text-slate-600">
                    Diajukan oleh: <strong className="text-slate-900">{req.submittedBy}</strong>
                  </p>

                  {req.details && req.details.length > 0 && (
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-xl border border-border bg-card p-3 text-sm sm:grid-cols-2">
                      {req.details.map((detail) => (
                        <div key={detail.label}>
                          <dt className="text-xs text-muted-foreground">{detail.label}</dt>
                          <dd className="font-medium text-foreground">{detail.value ?? '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {/* Automated Validation Results Card */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      <span>Hasil Pemeriksaan Otomatis Sistem:</span>
                      <span className={`px-2 py-0.2 rounded font-bold ${
                        req.validationStatus === 'PASSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.validationStatus === 'PASSED' ? '✓ Lolos Validasi Otomatis' : '⚠ Perlu Atensi Verifikator'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {req.validationChecks.map((chk, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                          {chk.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold">{chk.ruleName}: </span>
                            <span className="text-slate-500">{chk.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review Notes or Justifications if completed */}
                  {req.reviewedBy && (
                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
                      <strong>Keputusan oleh:</strong> {req.reviewedBy} ({req.reviewedAt})
                      {req.revisionNotes && <div className="mt-1 text-slate-700"><em>Catatan:</em> {req.revisionNotes}</div>}
                      {req.rejectionReason && <div className="mt-1 text-rose-700"><em>Alasan Penolakan:</em> {req.rejectionReason}</div>}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Status Pill */}
                  <div>
                    {canReview && req.approvalStatus === 'PENDING' && (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Menunggu Keputusan</span>
                      </span>
                    )}
                    {req.approvalStatus === 'APPROVED' && (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Telah Disetujui</span>
                      </span>
                    )}
                    {req.approvalStatus === 'REVISION_REQUESTED' && (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Perlu Revisi Operator</span>
                      </span>
                    )}
                    {req.approvalStatus === 'REJECTED' && (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Ditolak</span>
                      </span>
                    )}
                  </div>

                  {/* Decision Action Buttons (Available for Verifikator / Taskforce / Superadmin) */}
                  {req.approvalStatus === 'PENDING' && (
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-1.5 w-full sm:w-auto mt-2">
                      <button
                        onClick={() => {
                          setActiveModal({ type: 'approve', request: req });
                          setModalNotes('Disetujui dan memenuhi seluruh persyaratan substantif.');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui Data (Approve)</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveModal({ type: 'revision', request: req });
                          setModalNotes('');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Minta Perbaikan (Revisi)</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveModal({ type: 'reject', request: req });
                          setModalNotes('');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition flex items-center justify-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Tolak dengan Alasan</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Notes Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  {activeModal.type === 'approve' && 'Persetujuan Data Substantif'}
                  {activeModal.type === 'reject' && 'Penolakan Usulan Data'}
                  {activeModal.type === 'revision' && 'Pengembalian untuk Revisi Operator'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-slate-600">
                Usulan: <strong className="text-slate-900">{activeModal.request.title}</strong>
              </p>
              <p className="text-slate-500">
                Pengusul: {activeModal.request.submittedBy} ({activeModal.request.scopeLabel})
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                {activeModal.type === 'approve' && 'Catatan Persetujuan (Opsional):'}
                {activeModal.type === 'reject' && 'Alasan Penolakan (Wajib dicatat ke Audit Log):'}
                {activeModal.type === 'revision' && 'Instruksi Perbaikan bagi Operator (Wajib):'}
              </label>
              <textarea
                rows={4}
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder={
                  activeModal.type === 'approve'
                    ? 'Contoh: Dokumen lengkap dan telah diverifikasi silang dengan Dukcapil & BNSP.'
                    : activeModal.type === 'reject'
                    ? 'Contoh: Kuota tidak memenuhi standar keselamatan kerja bilateral.'
                    : 'Contoh: Lampirkan sertifikat bahasa dasar yang masih berlaku.'
                }
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {actionError && <p role="alert" className="mt-2 text-xs text-destructive">{actionError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold text-white shadow-xs transition ${
                  activeModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : activeModal.type === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {submitting ? 'Menyimpan…' : 'Konfirmasi & Simpan ke Audit Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
