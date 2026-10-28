import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Search,
  Download,
  ArrowRight,
  Terminal,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { AuditLogEntry, AuditActionType } from '../../types';

interface AuditLogViewProps {
  initialLogs?: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ initialLogs }) => {
  const { auditLogs, setAuditLogs } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Sync initial logs from server props if available and store is empty
  useEffect(() => {
    if (Array.isArray(initialLogs) && initialLogs.length > 0) {
      setAuditLogs(initialLogs);
      setLastSyncedTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
    }
  }, [initialLogs, setAuditLogs]);

  // Fetch live audit logs from backend API
  const syncAuditLogs = useCallback(async (showToast = true) => {
    setIsSyncing(true);
    try {
      const res = await axios.get('/business-data/audit-logs');
      if (res.data?.data && Array.isArray(res.data.data)) {
        if (res.data.data.length > 0) {
          setAuditLogs(res.data.data);
        }
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        setLastSyncedTime(timeStr);
        if (showToast) {
          toast.success(`Jejak audit berhasil disinkronkan (${res.data.total ?? res.data.data.length} rekaman).`);
        }
      }
    } catch {
      if (showToast) {
        toast.info('Menggunakan data jejak audit lokal / cache sesi saat ini.');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [setAuditLogs]);

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'ALL' && log.actionType !== filterAction) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchActor = (log.actorName || '').toLowerCase().includes(q);
      const matchRole = (log.actorRole || '').toLowerCase().includes(q);
      const matchEntity = (log.entity || '').toLowerCase().includes(q);
      const matchEntityId = (log.entityId || '').toLowerCase().includes(q);
      const matchReason = (log.justificationReason || '').toLowerCase().includes(q);
      const matchField = (log.fieldChanged || '').toLowerCase().includes(q);
      if (!matchActor && !matchRole && !matchEntity && !matchEntityId && !matchReason && !matchField) return false;
    }
    return true;
  });

  const getActionBadge = (type: AuditActionType | string) => {
    switch (type) {
      case 'PERSETUJUAN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Persetujuan</span>;
      case 'VERIFIKASI':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Verifikasi</span>;
      case 'INPUT_DATA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">Input Data</span>;
      case 'UPDATE_DATA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Pembaruan Data</span>;
      case 'HAPUS_DATA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Hapus Data</span>;
      case 'ALOKASI_MATCHING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">Alokasi Matching</span>;
      case 'REVISI':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">Minta Revisi</span>;
      case 'PENOLAKAN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Penolakan</span>;
      case 'AKUN_HAK_AKSES':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Hak Akses / Sesi</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">{type}</span>;
    }
  };

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Timestamp,Actor,Role,Scope,Action,Entity,Field,OldValue,NewValue,Reason,IPAddress']
        .concat(
          filteredLogs.map(
            (l) =>
              `"${l.id}","${l.timestamp}","${l.actorName}","${l.actorRole}","${l.scope}","${l.actionType}","${l.entity}","${l.fieldChanged || ''}","${l.oldValue || ''}","${l.newValue || ''}","${(l.justificationReason || '').replace(/"/g, '""')}","${l.ipAddress}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SGG_Audit_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Audit Trail & Kepatuhan Regulasi Nasional</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Audit Log & Rekam Jejak Perubahan Data
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mencatat setiap mutasi data substantif: <strong>siapa yang mengubah</strong>, <strong>kapan perubahan dilakukan</strong>, <strong>nilai sebelum dan sesudahnya</strong>, serta <strong>alasan perubahan</strong>.
          </p>
          {lastSyncedTime && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tersinkronisasi otomatis dengan basis data: {lastSyncedTime}</span>
            </div>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            onClick={() => syncAuditLogs(true)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            title="Muat ulang jejak audit terbaru dari database"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronkan Database'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Audit Log (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari aktor, entitas, ID, field, atau alasan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Semua Jenis Aksi</option>
            <option value="UPDATE_DATA">Pembaruan Data (Update)</option>
            <option value="INPUT_DATA">Input Data Baru</option>
            <option value="VERIFIKASI">Verifikasi Dokumen</option>
            <option value="PERSETUJUAN">Persetujuan Data</option>
            <option value="ALOKASI_MATCHING">Alokasi Matching</option>
            <option value="REVISI">Permintaan Revisi</option>
            <option value="PENOLAKAN">Penolakan Usulan</option>
            <option value="HAPUS_DATA">Penghapusan Data</option>
            <option value="AKUN_HAK_AKSES">Akses & Hak Akses</option>
          </select>
        </div>
      </div>

      {/* Audit Log Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-3">Aktor & Peran</th>
                <th className="py-3 px-3">Aksi</th>
                <th className="py-3 px-4">Entitas & Target</th>
                <th className="py-3 px-4">Nilai Sebelum & Sesudah</th>
                <th className="py-3 px-4">Alasan & Catatan Perubahan</th>
                <th className="py-3 px-3 text-right">Terminal IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ditemukan catatan audit log yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const hasOld = log.oldValue !== undefined && log.oldValue !== null && log.oldValue !== '';
                  const hasNew = log.newValue !== undefined && log.newValue !== null && log.newValue !== '';
                  const isIdentical = hasOld && hasNew && log.oldValue === log.newValue;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        <div>{log.timestamp}</div>
                        <span className="text-[10px] text-slate-400">#{log.id}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-slate-900">{log.actorName}</div>
                        <div className="text-[10px] text-slate-500">{log.actorRole}</div>
                        <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">{log.scope}</div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getActionBadge(log.actionType)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{log.entity}</div>
                        <div className="text-[11px] font-mono text-slate-500">{log.entityId}</div>
                      </td>

                      <td className="py-3.5 px-4 min-w-[200px]">
                        {log.fieldChanged || hasOld || hasNew ? (
                          <div className="space-y-1">
                            {log.fieldChanged && (
                              <span className="text-[10px] font-mono text-slate-400 block">
                                Field: {log.fieldChanged}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                              {hasOld && hasNew && !isIdentical ? (
                                <>
                                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 line-through">
                                    {log.oldValue}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                    {log.newValue}
                                  </span>
                                </>
                              ) : isIdentical ? (
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                                  {log.newValue}
                                </span>
                              ) : hasNew ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                  {log.newValue}
                                </span>
                              ) : hasOld ? (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 line-through">
                                  {log.oldValue}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs leading-relaxed">
                        {log.justificationReason}
                      </td>

                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {log.ipAddress}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
