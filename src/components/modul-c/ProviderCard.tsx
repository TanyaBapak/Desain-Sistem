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
  Trash2,
  Globe,
  ExternalLink,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { visitAllocationStage } from '../../lib/navigation';
import { InstitutionSourceBadge } from '../shared/InstitutionSourceBadge';
import { parseCatalogUrls } from '../../lib/utils';

interface ProviderCardProps {
  provider: VocationalProvider;
  onViewDetail: (provider: VocationalProvider) => void;
  onEditProvider?: (provider: VocationalProvider) => void;
  onDeleteProvider?: (provider: VocationalProvider) => void;
  onStatusChange?: (provider: VocationalProvider, newStatus: 'Negeri' | 'Swasta') => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onViewDetail,
  onEditProvider,
  onDeleteProvider,
  onStatusChange,
}) => {
  const {
    currentRole,
    selectedProgramId,
    selectedProviderId,
    setSelectedProviderId,
    setActiveStage,
  } = useAppStore();

  const isSelected = selectedProviderId === provider.id;

  const handleSelectProvider = () => {
    setSelectedProviderId(provider.id);
    setActiveStage(4);
    visitAllocationStage({ programId: selectedProgramId ?? undefined, providerId: provider.id });
  };

  const currentStatus = provider.institutionStatus === 'Negeri' ? 'Negeri' : 'Swasta';
  const nextStatus = currentStatus === 'Negeri' ? 'Swasta' : 'Negeri';
  const inaprocLinks = parseCatalogUrls(provider.procurementCatalogUrls ?? provider.procurementCatalogUrl);
  const hasInaproc = inaprocLinks.length > 0;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Header Card */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <InstitutionSourceBadge
              source={provider.registrationSource}
              sourceId={provider.registrationSourceId || provider.id}
            />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
              {provider.providerType}
            </span>
            {onStatusChange ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(provider, nextStatus);
                }}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1 group ${
                  currentStatus === 'Negeri'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100'
                }`}
                title={`Status: ${currentStatus}. Klik untuk mengubah menjadi ${nextStatus}`}
              >
                <span>{currentStatus}</span>
                <span className="text-[9px] opacity-40 group-hover:opacity-100 transition-opacity">⇄</span>
              </button>
            ) : (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                currentStatus === 'Negeri'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}>
                {currentStatus}
              </span>
            )}
            {provider.source === 'kp2mi-api' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" title="Data resmi dari vokasi.kp2mi.go.id">
                KP2MI
              </span>
            )}
            {hasInaproc ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                title={inaprocLinks.length > 1 ? `${inaprocLinks.length} tautan e-Katalog INAPROC terdaftar` : `Tautan e-Katalog INAPROC: ${inaprocLinks[0]}`}
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                <span>INAPROC Terisi{inaprocLinks.length > 1 ? ` (${inaprocLinks.length})` : ''}</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                title="Tautan e-Katalog LKPP / INAPROC belum diisi oleh lembaga"
              >
                <AlertCircle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                <span>INAPROC Belum</span>
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
              className="w-11 h-11 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shrink-0 shadow-xs"
              onError={(e) => {
                // Fallback to building icon if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
              <Building2 className="w-5 h-5 text-slate-400" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2" title={provider.name}>
              {provider.name}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate max-w-[150px]">{provider.kabupatenKota || provider.provinsi}</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Akreditasi {provider.accreditation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body Metrics */}
      <div className="p-5 space-y-3 bg-slate-50/40 dark:bg-slate-800/40 text-xs">
        {/* Metric Chips */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Jumlah Kelas</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {provider.classCount == null ? 'Belum tersedia' : `${provider.classCount} Kelas`}
            </span>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Peserta Siap Pelatihan</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {provider.readyParticipantCount == null ? 'Belum tersedia' : `${provider.readyParticipantCount} Orang`}
            </span>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Instruktur Tersertifikasi</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {provider.certifiedInstructorsCount == null ? 'Belum tersedia' : `${provider.certifiedInstructorsCount} Orang`}
            </span>
          </div>
        </div>

        {/* Operational Readiness Score */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Kesiapan Sarana Operasional:</span>
            </span>
            <span className="font-extrabold text-blue-700 dark:text-blue-400">
              {provider.operationalReadinessScore == null ? 'Belum tersedia' : `${provider.operationalReadinessScore} / 100`}
            </span>
          </div>
          {provider.operationalReadinessScore != null && (
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
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
          )}
        </div>

        {/* Sektor Spesialisasi Badges */}
        <div className="pt-1">
          <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block mb-1.5">
            Sektor Vokasi Unggulan:
          </span>
          <div className="flex flex-wrap gap-1">
            {provider.supportedSectors.map((sector, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                {sector}
              </span>
            ))}
          </div>
        </div>

        {/* Negara Penempatan Badges */}
        {provider.supportedCountries && provider.supportedCountries.length > 0 && (
          <div className="pt-2">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block mb-1">
              Negara Tujuan:
            </span>
            <div className="flex flex-wrap gap-1">
              {provider.supportedCountries.map((country, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                >
                  <Globe className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{country}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

        {/* Status & Preview Link INAPROC / Dokumen */}
        <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/60 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              Tautan e-Katalog INAPROC{inaprocLinks.length > 1 ? ` (${inaprocLinks.length})` : ''}:
            </span>
            {hasInaproc ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{inaprocLinks.length > 1 ? `${inaprocLinks.length} Tautan` : 'Sudah Mengisi'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Belum Mengisi</span>
              </span>
            )}
          </div>

          {hasInaproc ? (
            <div className="space-y-1.5">
              {inaprocLinks.map((link, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 py-1 px-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 text-[11px] font-medium transition-colors truncate max-w-full group"
                    title={`Buka tautan Inaproc e-Katalog LKPP: ${link}`}
                  >
                    <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{inaprocLinks.length > 1 ? `#${idx + 1}: ${link}` : link}</span>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                Tautan INAPROC belum diisi oleh lembaga
              </span>
              {onEditProvider && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProvider(provider);
                  }}
                  className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                >
                  + Isi Link
                </button>
              )}
            </div>
          )}

          {provider.mouDriveUrl && (
            <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between gap-2">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold">Berkas MoU:</span>
              <a
                href={provider.mouDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors"
                title="Buka Berkas Dokumen MoU"
              >
                <FileText className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Buka Dokumen MoU ↗</span>
              </a>
            </div>
          )}
        </div>
      {/* Card Footer Actions */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDetail(provider)}
          className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition"
        >
          Lihat Fasilitas Lab
        </button>

        {currentRole === 'taskforce' && (
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
        )}
      </div>
    </div>
  );
};
