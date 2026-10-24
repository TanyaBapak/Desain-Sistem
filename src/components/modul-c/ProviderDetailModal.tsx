import React from 'react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { VocationalProvider } from '../../types';
import {
  Building2,
  MapPin,
  Award,
  Users,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Flame,
  Check,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  UserCheck
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ProviderDetailModalProps {
  provider: VocationalProvider | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
  provider,
  isOpen,
  onClose,
}) => {
  const { updateProviderEvokasi, setSelectedProviderId, setActiveStage } = useAppStore();

  if (!provider) return null;

  const handleSelectForAllocation = () => {
    setSelectedProviderId(provider.id);
    setActiveStage(4);
    onClose();
  };

  const officialKp2miUrl = 'https://vokasi.kp2mi.go.id/cari-lembaga';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profil Kesiapan Lembaga Penyelenggara Vokasi"
      subtitle={`Kode Lembaga: ${provider.id} — Sinkronisasi Basis Data vokasi.kp2mi.go.id`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-md">
                Jenis: {provider.providerType}
              </span>
              {provider.institutionStatus && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Status: {provider.institutionStatus}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Status e-Vokasi:</span>
              <Badge
                variant={
                  provider.evokasiVerificationStatus === 'Terverifikasi e-Vokasi'
                    ? 'success'
                    : provider.evokasiVerificationStatus === 'Proses Verifikasi'
                    ? 'warning'
                    : 'danger'
                }
              >
                {provider.evokasiVerificationStatus}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-4">
            {provider.logoUrl ? (
              <img
                src={provider.logoUrl}
                alt={provider.name}
                className="w-14 h-14 object-contain rounded-xl border border-slate-200 bg-white p-1.5 shrink-0 shadow-xs"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-slate-400" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{provider.name}</h3>

              <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{provider.kabupatenKota}, {provider.provinsi}</span>
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-800">Akreditasi: {provider.accreditation}</span>
                {provider.procurementMethod && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-slate-800">
                      Skema penyelenggaraan: {provider.procurementMethod}
                    </span>
                  </>
                )}
              </div>

              {provider.address && (
                <p className="text-xs text-slate-500 mt-2 leading-relaxed bg-white/70 p-2 rounded-lg border border-slate-200/60">
                  {provider.address}
                </p>
              )}
            </div>
          </div>

          {/* Contact & Leader Info (if available from KP2MI) */}
          {(provider.leaderName || provider.phone || provider.email || provider.website) && (
            <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {provider.leaderName && (
                <div className="flex items-center gap-2 text-slate-700">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    <span className="text-slate-400">Pimpinan:</span> {provider.leaderName}{' '}
                    {provider.leaderPosition && `(${provider.leaderPosition})`}
                  </span>
                </div>
              )}
              {provider.phone && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    <span className="text-slate-400">Telp:</span> {provider.phone}
                  </span>
                </div>
              )}
              {provider.email && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">
                    <span className="text-slate-400">Email:</span> {provider.email}
                  </span>
                </div>
              )}
              {provider.website && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {provider.website}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3 Metric Summary Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
            <Users className="w-4 h-4 mx-auto text-blue-600 mb-1" />
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Kapasitas / Batch</span>
            <span className="text-base font-extrabold text-slate-800">
              {provider.capacityPerBatch == null ? 'Belum tersedia' : `${provider.capacityPerBatch} Siswa`}
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
            <Award className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Instruktur Tersertifikasi</span>
            <span className="text-base font-extrabold text-slate-800">
              {provider.certifiedInstructorsCount == null ? 'Belum tersedia' : `${provider.certifiedInstructorsCount} Orang`}
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
            <Flame className="w-4 h-4 mx-auto text-amber-500 mb-1" />
            <span className="text-[11px] text-slate-400 uppercase font-bold block">Skor Kesiapan Operasional</span>
            <span className="text-base font-extrabold text-blue-600">
              {provider.operationalReadinessScore == null ? 'Belum tersedia' : `${provider.operationalReadinessScore} / 100`}
            </span>
          </div>
        </div>

        {/* Sektor Spesialisasi */}
        <div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
            Sektor & Bidang Spesialisasi:
          </span>
          <div className="flex flex-wrap gap-2">
            {provider.supportedSectors.map((sector, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
              >
                {sector}
              </span>
            ))}
          </div>
        </div>

        {/* Fasilitas & Sarana Lab */}
        <div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
            Kelengkapan Fasilitas Laboratorium & Workshop Standar:
          </span>
          <div className="space-y-2">
            {provider.facilities.map((facility, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-slate-800 font-medium leading-relaxed">{facility}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Verifikasi e-Vokasi & Allocation */}
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-200 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Simulasi e-Vokasi:</span>
            {provider.evokasiVerificationStatus !== 'Terverifikasi e-Vokasi' ? (
              <button
                onClick={() => updateProviderEvokasi(provider.id, 'Terverifikasi e-Vokasi')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verifikasi e-Vokasi</span>
              </button>
            ) : (
              <button
                onClick={() => updateProviderEvokasi(provider.id, 'Proses Verifikasi')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
              >
                Ubah ke Proses
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://vokasi.kp2mi.go.id/cari-lembaga"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di vokasi.kp2mi.go.id ↗</span>
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Tutup
            </button>
            <button
              onClick={handleSelectForAllocation}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Tetapkan Lembaga (Tahap 4)</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
