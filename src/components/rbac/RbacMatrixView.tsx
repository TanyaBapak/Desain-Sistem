import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Minus,
  Layers,
  Users,
  Eye,
  PlusCircle,
  Edit3,
  FileCheck2,
  Trash2,
  Download,
  Info,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Lock,
  RotateCcw,
  Clock,
  CheckCheck,
  HelpCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockRoles, stakeholderRoles13, operationalCrudRules, getRoleById } from '../../data';
import { UserRole, MenuModuleId, AccessLevel, PermissionToken } from '../../types';

export const RbacMatrixView: React.FC = () => {
  const { currentRole, currentScope } = useAppStore();
  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<UserRole>(currentRole);
  const [viewTab, setViewTab] = useState<'crud' | 'rules' | 'lifecycle' | 'tokens' | 'matrix' | 'roles13'>('crud');

  const selectedRoleObj = getRoleById(selectedRoleForDetail);
  const activeRoleObj = getRoleById(currentRole);

  const menuRows: { id: MenuModuleId; label: string; description: string }[] = [
    { id: 'overview', label: 'Dashboard Nasional', description: 'Capaian target 50.000, agregat supply-demand, & drill-down wilayah' },
    { id: 'modul-a', label: 'Data Calon Peserta', description: 'Biodata CPMI vokasi, NIK Dukcapil, kompetensi, & bahasa' },
    { id: 'modul-b', label: 'Program Pelatihan', description: 'Katalog upskilling/reskilling, JP silabus, & sertifikasi SSW' },
    { id: 'modul-c', label: 'Data Lembaga Vokasi', description: 'Profil SMK/BLK, akreditasi e-Vokasi, & kapasitas bengkel kerja' },
    { id: 'modul-d', label: 'Demand Luar Negeri', description: 'Permintaan tenaga kerja resmi Jepang, Jerman, Korea, Taiwan' },
    { id: 'matching', label: 'Matching & Penempatan', description: 'Komputasi algoritma kecocokan kandidat & penetapan batch' },
    { id: 'approvals', label: 'Alur Persetujuan Data', description: 'Pemeriksaan validitas data, persetujuan, penolakan, & revisi' },
    { id: 'audit', label: 'Audit Log & Riwayat', description: 'Pencatatan jejak mutasi data, aktor, waktu, & nilai sebelum/sesudah' },
    { id: 'rbac', label: 'Manajemen Akun & Role', description: 'Konfigurasi kredensial pengguna, assignment role, & batasan scope' },
  ];

  const coreRolesForMatrix: { id: UserRole; shortName: string; color: string }[] = [
    { id: 'pimpinan', shortName: 'Pimpinan', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { id: 'taskforce', shortName: 'Task Force', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'disnaker', shortName: 'Disnaker', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { id: 'vokasi', shortName: 'Lembaga', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { id: 'demand', shortName: 'Demand LN', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    { id: 'verifikator', shortName: 'Verifikator', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    { id: 'matching', shortName: 'Matching', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { id: 'superadmin', shortName: 'Super Admin', color: 'bg-slate-200 text-slate-800 border-slate-300' },
  ];

  const renderAccessIcon = (level: AccessLevel) => {
    if (level === 'full') {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-xs" title="Akses Utama (Full)">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span className="text-xs">● Utama</span>
        </span>
      );
    }
    if (level === 'limited') {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-xs" title="Akses Terbatas / Ter-Scope">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="text-xs">◐ Terbatas</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center font-bold text-slate-400 text-xs" title="Tidak Ada Akses">
        —
      </span>
    );
  };

  const renderCrudBadges = (codeString: string) => {
    if (!codeString || codeString === '—') {
      return <span className="text-slate-300 font-bold">—</span>;
    }

    if (codeString === 'R terbatas') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
          <span>R</span>
          <span className="text-[9px] font-normal text-blue-500">(terbatas)</span>
        </span>
      );
    }

    const hasStar = codeString.includes('*');
    const cleanCode = codeString.replace('*', '').replace(' ', '');
    const parts = cleanCode.split('/');

    return (
      <span className="inline-flex items-center gap-1">
        {parts.map((p, idx) => {
          let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
          if (p === 'C') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
          else if (p === 'R') badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
          else if (p === 'U') badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
          else if (p === 'D') badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
          else if (p === 'V') badgeClass = 'bg-purple-100 text-purple-800 border-purple-300';

          return (
            <span
              key={idx}
              className={`w-5 h-5 rounded flex items-center justify-center font-black text-[11px] border ${badgeClass}`}
            >
              {p}
            </span>
          );
        })}
        {hasStar && (
          <span className="text-amber-500 font-black text-xs" title="Akses dibatasi wilayah, program, atau kasus kewenangan">*</span>
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tata Kelola Hak Akses CRUD & Integritas Data Nasional</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Matriks CRUD, Permission Token & Siklus Data
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Prinsip integritas data: <em>"Tidak semua role boleh melakukan CRUD penuh, terutama untuk data yang sudah diverifikasi atau menjadi dasar penetapan target nasional. Super Admin mengelola konfigurasi teknis, bukan otomatis berwenang menyetujui data substantif."</em>
            </p>
          </div>

          {/* Active Role Status & Switcher Card */}
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 text-xs space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Peran Aktif:</span>
              <span className="px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeRoleObj.title}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Scope Wilayah:</span>
              <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                {currentScope.name}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-indigo-300">
              <span>Tingkat Scope: <strong className="uppercase">{currentScope.level}</strong></span>
              <span className="text-emerald-400 font-bold">● Terautentikasi</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls (6 Comprehensive Views) */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setViewTab('crud')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              viewTab === 'crud'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>1. Matriks CRUD 13 Role (C/R/U/D/V)</span>
          </button>

          <button
            onClick={() => setViewTab('rules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              viewTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>2. Aturan Operasional per Modul</span>
          </button>

          <button
            onClick={() => setViewTab('lifecycle')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              viewTab === 'lifecycle'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>3. Siklus Status Data (Draft &rarr; Approved)</span>
          </button>

          <button
            onClick={() => setViewTab('tokens')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              viewTab === 'tokens'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>4. Permission Tokens Sistem</span>
          </button>

          <button
            onClick={() => setViewTab('matrix')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              viewTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Akses Menu (●, ◐, —)</span>
          </button>

          <button
            onClick={() => setViewTab('roles13')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              viewTab === 'roles13'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Profil 13 Stakeholder</span>
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: Matriks CRUD per Role (C/R/U/D/V) matching Section 1 */}
      {viewTab === 'crud' && (
        <div className="space-y-6">
          {/* Legend and Explanation Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Keterangan Kode Hak Akses CRUD & Otorisasi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemisahan hak cipta, baca, ubah, hapus, dan verifikasi untuk menjamin data integrity.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]">C</span>
                <span>Create (Buat Baru)</span>
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px]">R</span>
                <span>Read (Lihat Data)</span>
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                <span className="w-4 h-4 rounded bg-amber-600 text-white flex items-center justify-center text-[10px]">U</span>
                <span>Update (Ubah Data)</span>
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                <span className="w-4 h-4 rounded bg-rose-600 text-white flex items-center justify-center text-[10px]">D</span>
                <span>Delete (Hapus Terbatas)</span>
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                <span className="w-4 h-4 rounded bg-purple-600 text-white flex items-center justify-center text-[10px]">V</span>
                <span>Verify / Approve</span>
              </span>
              <span className="text-xs text-amber-600 font-bold px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">
                * = Scoped (Wilayah/Lembaga)
              </span>
            </div>
          </div>

          {/* Table 1: Complete 13 Roles CRUD Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Matriks Hak CRUD Lengkap (13 Stakeholder SGG-CC)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap peran memiliki batasan manipulasi data sesuai kepemilikan dan yurisdiksi.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Blueprint Bagian 1</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-72">Role Pemangku Kepentingan</th>
                    <th className="py-3 px-4 text-center">Peserta</th>
                    <th className="py-3 px-4 text-center">Program Pelatihan</th>
                    <th className="py-3 px-4 text-center">Lembaga Vokasi</th>
                    <th className="py-3 px-4 text-center">Demand Luar Negeri</th>
                    <th className="py-3 px-4 text-center">Matching & Penempatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stakeholderRoles13.map((stk) => {
                    const isCurrentRole = activeRoleObj.id === stk.coreGroup;
                    return (
                      <tr
                        key={stk.no}
                        className={`hover:bg-slate-50/90 transition ${
                          isCurrentRole ? 'bg-blue-50/40 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-bold text-slate-400">
                          {stk.no}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{stk.name}</span>
                            {isCurrentRole && (
                              <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                                Aktif
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                            {stk.primaryAccess}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderCrudBadges(stk.crud.peserta)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderCrudBadges(stk.crud.pelatihan)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderCrudBadges(stk.crud.lembaga)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderCrudBadges(stk.crud.demand)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderCrudBadges(stk.crud.matching)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <strong>* Catatan:</strong> Tanda asteris (*) menandakan akses dibatasi pada data, wilayah, program, atau kasus yang menjadi kewenangannya.
              </div>
              <div className="text-slate-600">
                <strong>Prinsip:</strong> Super Admin mengelola konfigurasi teknis & akun, bukan menyetujui data substantif.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: Aturan Operasional CRUD per Modul matching Section 2 */}
      {viewTab === 'rules' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-extrabold text-slate-900">
                Pembagian Hak CRUD Berdasarkan Modul Data (Panduan Operasional)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aturan baku sistem mengenai siapa yang berhak Create, Update, dan batasan ketat Delete per modul data.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-52">Modul Data</th>
                    <th className="py-3 px-4 text-emerald-800">Role yang Boleh Create</th>
                    <th className="py-3 px-4 text-amber-800">Role yang Boleh Update</th>
                    <th className="py-3 px-4 text-rose-800">Role yang Boleh Delete</th>
                    <th className="py-3 px-4 text-slate-700">Aturan Siklus & Integritas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operationalCrudRules.map((r) => (
                    <tr key={r.moduleId} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {r.moduleName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold block w-fit mb-1">
                          Create
                        </span>
                        <span>{r.createRole}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold block w-fit mb-1">
                          Update
                        </span>
                        <span>{r.updateRole}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold block w-fit mb-1">
                          Delete
                        </span>
                        <span>{r.deleteRole}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] leading-relaxed max-w-xs">
                        {r.lifecycleNote}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 3: Siklus Status Data (Lifecycle) matching Section 3 */}
      {viewTab === 'lifecycle' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
                DATA INTEGRITY & LIFECYCLE MANAGEMENT
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Alur Status Data (Draft &rarr; Submitted &rarr; Approved &rarr; Returned)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-3xl">
                Untuk mencegah manipulasi data target nasional dan mempertahankan jejak audit yang dapat dipertanggungjawabkan, sistem menerapkan 4 status resmi data operasional.
              </p>
            </div>

            {/* Visual 4-Stage Lifecycle Flow Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status 1: DRAFT */}
              <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full font-black text-[10px] bg-slate-200 text-slate-800 uppercase tracking-wider">
                      STATUS 1
                    </span>
                    <span className="text-slate-400 font-bold">Lokal Operator</span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">DRAFT</h4>
                  <p className="text-slate-600 mt-1.5 leading-relaxed">
                    Operator (Disnaker, Lembaga, atau Demand) membuat, melengkapi berkas, dan bebas mengedit data sebelum diajukan.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                  <strong>Aksi Boleh:</strong> Full CRUD oleh pembuat data.
                </div>
              </div>

              {/* Status 2: SUBMITTED */}
              <div className="p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-300 text-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full font-black text-[10px] bg-amber-500 text-white uppercase tracking-wider">
                      STATUS 2
                    </span>
                    <span className="text-amber-700 font-bold">Dalam Antrean</span>
                  </div>
                  <h4 className="text-base font-extrabold text-amber-950">SUBMITTED</h4>
                  <p className="text-slate-600 mt-1.5 leading-relaxed">
                    Data diajukan secara resmi ke pusat. Pengeditan langsung oleh operator dikunci sementara untuk mencegah perubahan sepihak saat verifikasi.
                  </p>
                </div>
                <div className="pt-3 border-t border-amber-200 text-[11px] text-amber-800">
                  <strong>Aksi Boleh:</strong> Read oleh Verifikator & Task Force.
                </div>
              </div>

              {/* Status 3: APPROVED */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-400 text-xs flex flex-col justify-between space-y-3 ring-2 ring-emerald-300/50">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full font-black text-[10px] bg-emerald-600 text-white uppercase tracking-wider">
                      STATUS 3 (RESMI)
                    </span>
                    <span className="text-emerald-700 font-bold">Terkunci & Sah</span>
                  </div>
                  <h4 className="text-base font-extrabold text-emerald-950">APPROVED</h4>
                  <p className="text-slate-600 mt-1.5 leading-relaxed">
                    Data disahkan oleh Verifikator / Pejabat Berwenang. Menjadi basis data resmi untuk algoritma smart matching dan monitoring capaian pimpinan.
                  </p>
                </div>
                <div className="pt-3 border-t border-emerald-200 text-[11px] text-emerald-800">
                  <strong>Aksi Boleh:</strong> Read, Matching, Penempatan. (Perubahan wajib melalui addendum & revisi tercatat).
                </div>
              </div>

              {/* Status 4: RETURNED */}
              <div className="p-5 rounded-2xl bg-purple-50/70 border-2 border-purple-300 text-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full font-black text-[10px] bg-purple-600 text-white uppercase tracking-wider">
                      STATUS 4
                    </span>
                    <span className="text-purple-700 font-bold">Perlu Perbaikan</span>
                  </div>
                  <h4 className="text-base font-extrabold text-purple-950">RETURNED</h4>
                  <p className="text-slate-600 mt-1.5 leading-relaxed">
                    Data dikembalikan oleh Verifikator kepada operator pengusul disertai catatan perbaikan yang jelas untuk diperbaiki dan diajukan ulang.
                  </p>
                </div>
                <div className="pt-3 border-t border-purple-200 text-[11px] text-purple-800">
                  <strong>Aksi Boleh:</strong> Update oleh operator pengusul.
                </div>
              </div>
            </div>

            {/* Soft Delete & Audit Lock Principles */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white text-xs space-y-3 border border-slate-800">
              <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Prinsip Perlindungan Data (Soft Delete & Audit Lock)</span>
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300 text-xs pt-1">
                <li className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <strong className="text-amber-400 block mb-1">1. Anti-Hard Delete</strong>
                  Data yang sudah pernah berstatus <code>APPROVED</code> tidak boleh dihapus permanen dari database. Gunakan flag <code>is_cancelled</code> atau <code>is_inactive</code>.
                </li>
                <li className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <strong className="text-amber-400 block mb-1">2. Perubahan Substantif via Audit Log</strong>
                  Setiap perubahan data approved harus mencantumkan alasan justifikasi, tanggal, dan nama pejabat pengubah yang otomatis terekam di Audit Trail.
                </li>
                <li className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <strong className="text-amber-400 block mb-1">3. Versioning Target Nasional</strong>
                  Target kuota 50.000 PMI yang sudah ditetapkan tidak dapat diubah tanpa SK Addendum versi baru (v1 &rarr; v2).
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 4: Permission Tokens Sistem matching Section 4 */}
      {viewTab === 'tokens' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
                TOKEN-BASED ACCESS CONTROL (GRANULAR PERMISSION ENGINE)
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Daftar Permission Token & Scope Pengguna
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemisahan string permission untuk setiap aksi sistem yang dikombinasikan dengan scope yurisdiksi.
              </p>
            </div>

            {/* Token Category Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Participant Tokens */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="font-extrabold text-slate-900 block border-b pb-1.5">
                  Modul Calon Peserta (participant.*)
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-emerald-700">✓ participant.create</div>
                  <div className="text-blue-700">✓ participant.read</div>
                  <div className="text-amber-700">✓ participant.update</div>
                  <div className="text-rose-700">✓ participant.delete (draft only)</div>
                  <div className="text-purple-700 font-bold">✓ participant.verify</div>
                </div>
              </div>

              {/* Training Tokens */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="font-extrabold text-slate-900 block border-b pb-1.5">
                  Modul Pelatihan Vokasi (training.*)
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-emerald-700">✓ training.create</div>
                  <div className="text-blue-700">✓ training.read</div>
                  <div className="text-amber-700">✓ training.update</div>
                  <div className="text-rose-700">✓ training.delete (unallocated)</div>
                  <div className="text-purple-700 font-bold">✓ training.approve</div>
                </div>
              </div>

              {/* Provider Tokens */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="font-extrabold text-slate-900 block border-b pb-1.5">
                  Modul Lembaga Vokasi (provider.*)
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-emerald-700">✓ provider.create</div>
                  <div className="text-blue-700">✓ provider.read</div>
                  <div className="text-amber-700">✓ provider.update</div>
                  <div className="text-rose-700">✓ provider.delete (strict check)</div>
                  <div className="text-purple-700 font-bold">✓ provider.verify (e-Vokasi)</div>
                </div>
              </div>

              {/* Demand Tokens */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="font-extrabold text-slate-900 block border-b pb-1.5">
                  Modul Demand LN (demand.*)
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-emerald-700">✓ demand.create</div>
                  <div className="text-blue-700">✓ demand.read</div>
                  <div className="text-amber-700">✓ demand.update</div>
                  <div className="text-rose-700">✓ demand.delete (cancelled only)</div>
                  <div className="text-purple-700 font-bold">✓ demand.verify (BP3MI)</div>
                </div>
              </div>

              {/* Matching & Placement Tokens */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="font-extrabold text-slate-900 block border-b pb-1.5">
                  Matching & Penempatan (matching.* / placement.*)
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-blue-700">✓ matching.read</div>
                  <div className="text-indigo-700 font-bold">✓ matching.assign</div>
                  <div className="text-amber-700">✓ matching.update</div>
                  <div className="text-rose-700">✓ matching.cancel</div>
                  <div className="text-emerald-700">✓ placement.read / update / verify</div>
                </div>
              </div>

              {/* Admin & Security Tokens */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="font-extrabold text-slate-900 block border-b pb-1.5">
                  Manajemen Sistem & Audit (admin.*)
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-purple-700 font-bold">✓ user.manage</div>
                  <div className="text-purple-700 font-bold">✓ role.manage</div>
                  <div className="text-slate-800 font-bold">✓ audit.read</div>
                  <div className="text-blue-700">✓ report.export</div>
                </div>
              </div>
            </div>

            {/* Token Inspector for Selected Role */}
            <div className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900">
                  Token Permission yang Dimiliki Role Aktif: <strong>{activeRoleObj.title}</strong>
                </span>
                <span className="text-slate-500 font-mono">Scope: {currentScope.name}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeRoleObj.permissionTokens.map((tok) => (
                  <span
                    key={tok}
                    className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-white text-blue-800 border border-blue-200 shadow-2xs"
                  >
                    {tok}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 5: Matriks Akses Menu Aplikasi (Original View) */}
      {viewTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Tabel Matriks Hak Akses per Modul Menu Aplikasi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Keterangan: <strong className="text-emerald-700 font-bold">● Akses utama</strong> (Full CRUD/Approval), <strong className="text-amber-700 font-bold">◐ Akses terbatas</strong> (Scoped sesuai wilayah/lembaga), <strong className="text-slate-400 font-bold">— Tidak ada akses</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                  ● Utama
                </span>
                <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                  ◐ Terbatas
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200 font-bold text-[11px]">
                  — Tidak Ada
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
                    <th className="py-3 px-4 font-extrabold w-64 sticky left-0 bg-slate-100 z-10 shadow-xs">
                      Menu Aplikasi
                    </th>
                    {coreRolesForMatrix.map((r) => (
                      <th
                        key={r.id}
                        className={`py-3 px-3 text-center font-bold whitespace-nowrap cursor-pointer hover:bg-slate-200 transition ${
                          selectedRoleForDetail === r.id ? 'bg-blue-50 text-blue-900 ring-1 ring-blue-300' : ''
                        }`}
                        onClick={() => setSelectedRoleForDetail(r.id)}
                        title={`Klik untuk melihat rincian permission ${r.shortName}`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{r.shortName}</span>
                          {currentRole === r.id && (
                            <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-black mt-0.5">
                              Aktif
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {menuRows.map((menu) => (
                    <tr key={menu.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 sticky left-0 bg-white font-medium text-slate-900 shadow-xs">
                        <div className="font-bold text-slate-800">{menu.label}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{menu.description}</div>
                      </td>
                      {coreRolesForMatrix.map((r) => {
                        const roleObj = getRoleById(r.id);
                        const perm = roleObj.permissions[menu.id];
                        const isSelectedCol = selectedRoleForDetail === r.id;
                        return (
                          <td
                            key={r.id}
                            className={`py-3 px-3 text-center transition ${
                              isSelectedCol ? 'bg-blue-50/30 font-bold' : ''
                            }`}
                          >
                            {perm ? renderAccessIcon(perm.accessLevel) : <span className="text-slate-300">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 6: Profil 13 Stakeholder Lengkap */}
      {viewTab === 'roles13' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 block mb-0.5">
                  STANDAR KEAMANAN & AUTENTIKASI SISTEM TERPADU
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Daftar 13 Role yang Wajib Memiliki Login & Logout (SSO Terpadu)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seluruh 13 kelompok role menggunakan 1 halaman login terpadu. Perbedaan terletak pada hak akses, tampilan dashboard, dan batas wilayah (scope) data.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  ✓ 13/13 Role Login & Logout Wajib
                </span>
              </div>
            </div>

            {/* Official Table from Section 1 */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700">
                    <th className="py-3 px-3 text-center font-bold w-12">No.</th>
                    <th className="py-3 px-4 font-bold">Role Pemangku Kepentingan</th>
                    <th className="py-3 px-3 text-center font-bold">Login</th>
                    <th className="py-3 px-3 text-center font-bold">Logout</th>
                    <th className="py-3 px-4 font-bold">Halaman Awal Setelah Login</th>
                    <th className="py-3 px-4 font-bold text-center">Aksi Pengujian Sesi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stakeholderRoles13.map((role) => {
                    const isCurrentActive = currentRole === role.coreGroup && currentScope.level === role.scopeType;
                    return (
                      <tr key={role.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 text-center font-bold text-slate-500">
                          {role.no}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{role.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">{role.primaryAccess}</span>
                          <span className="text-[10px] text-amber-700 font-mono block mt-0.5">
                            Scope: {role.scopeType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Wajib
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                            Wajib
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 inline-block">
                            {role.primaryAccess}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            disabled
                            className="mx-auto flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600"
                          >
                            {isCurrentActive ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Role aktif</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Akun server</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Section 2 & 5 Security Blueprint Information */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>1. Login Terpadu & MFA</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Semua stakeholder masuk melalui 1 pintu SSO terpusat. Akun tingkat tinggi (Super Admin, Menteri, Task Force, Verifikator, Auditor) diproteksi dengan Multi-Factor Authentication.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>2. Role Engine & Data Scope</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Setelah login, sistem otomatis membaca izin CRUD dan batas yurisdiksi (Nasional, Provinsi, Kab/Kota, Lembaga, atau Mitra LN), bukan sekadar nama jabatan.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span>3. Sesi Terlindungi & Logout</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Sesi berakhir otomatis saat inaktif. Saat tombol Logout ditekan, token dihancurkan dan penekanan tombol Back tidak membuka data internal tanpa autentikasi ulang.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
