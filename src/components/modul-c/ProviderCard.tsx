import React from 'react';
import { VocationalProvider } from '../../types';
import { Badge } from '../ui/Badge';
import {
  Building2,
  MapPin,
  Users,
  Award,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Flame,
  Edit2,
  Trash2
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ProviderCardProps {
  provider: VocationalProvider;
  onViewDetail: (provider: VocationalProvider) => void;
  onEditProvider?: (provider: VocationalProvider) => void;
  onDeleteProvider?: (provider: VocationalProvider) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onViewDetail,
  onEditProvider,
  onDeleteProvider,
}) => {
  const { selectedProviderId, setSelectedProviderId, setActiveStage } = useAppStore();

  const isSelected = selectedProviderId === provider.id;

  const handleSelectProvider = () => {
    setSelectedProviderId(provider.id);
    setActiveStage(4);
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Header Card */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
              {provider.providerType}
            </span>
            {provider.institutionStatus && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                provider.institutionStatus === 'Negeri'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {provider.institutionStatus}
              </span>
            )}
            {provider.source === 'kp2mi-api' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200" title="Data resmi dari vokasi.kp2mi.go.id">
                KP2MI
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant={
                provider.evokasiVerificationStatus === 'Terverifikasi e-Vokasi'
                  ? 'success'
                  : provider.evokasiVerificationStatus === 'Proses Verifikasi'
                  ? 'warning'
                  : 'danger'
              }
              size="sm"
            >
              {provider.evokasiVerificationStatus === 'Terverifikasi e-Vokasi' && (
                <ShieldCheck className="w-3 h-3 mr-1" />
              )}
              {provider.evokasiVerificationStatus}
            </Badge>

            {onEditProvider && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProvider(provider);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                title="Edit Lembaga Vokasi"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onDeleteProvider && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProvider(provider);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Hapus / Nonaktifkan Lembaga"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          {provider.logoUrl ? (
            <img
              src={provider.logoUrl}
              alt={provider.name}
              className="w-11 h-11 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0 shadow-xs"
              onError={(e) => {
                // Fallback to building icon if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
              <Building2 className="w-5 h-5 text-slate-400" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2" title={provider.name}>
              {provider.name}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate max-w-[150px]">{provider.kabupatenKota || provider.provinsi}</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700">Akreditasi {provider.accreditation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body Metrics */}
      <div className="p-5 space-y-3 bg-slate-50/40 text-xs">
        {/* Metric Chips */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Kapasitas / Batch</span>
            <span className="font-bold text-slate-800 text-sm">{provider.capacityPerBatch} Siswa</span>
          </div>

          <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Instruktur Tersertifikasi</span>
            <span className="font-bold text-slate-800 text-sm">{provider.certifiedInstructorsCount} Orang</span>
          </div>
        </div>

        {/* Operational Readiness Score */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Kesiapan Sarana Operasional:</span>
            </span>
            <span className="font-extrabold text-blue-700">{provider.operationalReadinessScore} / 100</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                provider.operationalReadinessScore >= 90
                  ? 'bg-emerald-500'
                  : provider.operationalReadinessScore >= 80
                  ? 'bg-blue-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${provider.operationalReadinessScore}%` }}
            />
          </div>
        </div>

        {/* Sektor Spesialisasi Badges */}
        <div className="pt-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1.5">
            Sektor Vokasi Unggulan:
          </span>
          <div className="flex flex-wrap gap-1">
            {provider.supportedSectors.map((sector, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700"
              >
                {sector}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDetail(provider)}
          className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          Lihat Fasilitas Lab
        </button>

        <button
          type="button"
          onClick={handleSelectProvider}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs ${
            isSelected
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Terpilih di Tahap 4</span>
            </>
          ) : (
            <>
              <span>Pilih Lembaga</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
