<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('institutions')) {
            return;
        }

        // 1. Tambahkan kolom is_priority_partner bila belum ada
        if (! Schema::hasColumn('institutions', 'is_priority_partner')) {
            Schema::table('institutions', function (Blueprint $table) {
                $table->boolean('is_priority_partner')->default(false)->after('status');
            });
        }

        // 2. Daftar 34 Lembaga Vokasi Mitra Prioritas (Pilot MoU Pimpinan)
        $priorityInstitutions = [
            'SMK Negeri 2 Purwodadi',
            'POLITEKNIK INDONUSA SURAKARTA',
            'LPK EIKO GAKKOU',
            'Sekolah Tinggi Ilmu Kesehatan Tujuh Belas',
            'Universitas Duta Bangsa Surakarta',
            'Universitas Mitra Husada',
            'Duta Internasional',
            'POLITEKNIK ASSALAAM SURAKARTA',
            'LKP GRAHA WISATA',
            'Graha Wisata',
            'Lembaga pelatihan kerja baruna academy international',
            'Genesis Talent Academy Profesional',
            'Sekolah Tinggi Pariwisata Ambarrukmo Yogyakarta',
            'SMK NEGERI 1 MUNDU',
            'Institut Kesehatan Rajawali',
            'Institut Kesehatan Immanuel Bandung',
            'Universitas Wiralodra',
            'LKP Padjadjaran Mitra Education Center',
            'LPK Hayashi',
            'LKP KARYA DUTA',
            'LKP Citra International Tourism Institute',
            'Institut Pariwisata Tedja Indonesia',
            'LPIA Hotel dan Kapal Pesiar',
            'LKP Erlangga Blitar',
            'Universitas Kepanjen',
            'LKP STUDY HOTEL EXECUTIVE',
            'LKP American English Course (AEC)',
            'LPK Hotel and Cruise International (H.I)',
            'LKP P4M',
            'LPK Trijasa',
            'House of Learning',
            'LKP Smart Plus',
            'Metro Hotel School',
            'MITRA SAURI',
        ];

        // Tandai lembaga mitra prioritas di database
        foreach ($priorityInstitutions as $instName) {
            $stripped = trim(preg_replace('/^(lpk|lkp|smk|politeknik|universitas|sekolah tinggi|institut)\s+/i', '', $instName));

            DB::table('institutions')
                ->where(function ($q) use ($instName, $stripped) {
                    $q->where('name', 'LIKE', '%' . $instName . '%')
                      ->orWhere('name', 'LIKE', '%' . $stripped . '%');
                })
                ->update(['is_priority_partner' => true]);
        }

        // 3. Konsolidasi & Deduplikasi Lembaga Kembar / Variasi Nama yang Sama
        // Kasus 1: "Graha Wisata" dan "LKP GRAHA WISATA"
        $masterGraha = DB::table('institutions')
            ->where('status', 'Aktif')
            ->where(function ($q) {
                $q->where('name', 'LIKE', '%LKP GRAHA WISATA%')
                  ->orWhere('name', 'LIKE', '%Graha Wisata%');
            })
            ->orderByRaw("CASE WHEN name LIKE 'LKP%' THEN 0 ELSE 1 END")
            ->first();

        if ($masterGraha) {
            $duplicateGrahas = DB::table('institutions')
                ->where('id', '!=', $masterGraha->id)
                ->where(function ($q) {
                    $q->where('name', 'Graha Wisata')
                      ->orWhere('name', 'LKP Graha Wisata')
                      ->orWhere('name', 'LKP GRAHA WISATA');
                })
                ->get();

            foreach ($duplicateGrahas as $dup) {
                // Pindahkan akun user ke master
                DB::table('users')
                    ->where('institution_id', $dup->id)
                    ->update([
                        'institution_id' => $masterGraha->id,
                        'organization' => $masterGraha->name,
                        'scope_name' => $masterGraha->name,
                    ]);

                // Pindahkan supply job_seekers ke master tanpa menghapus
                DB::table('job_seekers')
                    ->where('institution_id', $dup->id)
                    ->update([
                        'institution_id' => $masterGraha->id,
                        'institution_name' => $masterGraha->name,
                    ]);

                // Non-aktifkan record duplikat
                DB::table('institutions')
                    ->where('id', $dup->id)
                    ->update([
                        'status' => 'Nonaktif',
                        'is_priority_partner' => false,
                    ]);
            }
        }

        // Kasus 2: "Politeknik Indonusa Surakarta" dan variasi duplikat
        $masterIndonusa = DB::table('institutions')
            ->where('status', 'Aktif')
            ->where('name', 'LIKE', '%Politeknik Indonusa%')
            ->first();

        if ($masterIndonusa) {
            $dupIndonusa = DB::table('institutions')
                ->where('id', '!=', $masterIndonusa->id)
                ->where('name', 'LIKE', '%Indonusa%')
                ->get();

            foreach ($dupIndonusa as $dup) {
                DB::table('users')
                    ->where('institution_id', $dup->id)
                    ->update([
                        'institution_id' => $masterIndonusa->id,
                        'organization' => $masterIndonusa->name,
                        'scope_name' => $masterIndonusa->name,
                    ]);

                DB::table('job_seekers')
                    ->where('institution_id', $dup->id)
                    ->update([
                        'institution_id' => $masterIndonusa->id,
                        'institution_name' => $masterIndonusa->name,
                    ]);

                DB::table('institutions')
                    ->where('id', $dup->id)
                    ->update([
                        'status' => 'Nonaktif',
                        'is_priority_partner' => false,
                    ]);
            }
        }

        // 4. Pastikan semua user Admin Lembaga Vokasi yang aktif terhubung ke institution_id yang valid
        $adminUsers = DB::table('users')
            ->join('model_has_roles', 'model_has_roles.model_id', '=', 'users.id')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('roles.name', 'institution_admin')
            ->where('model_has_roles.model_type', 'App\Models\User')
            ->where('users.status', 'Aktif')
            ->get(['users.id', 'users.name', 'users.organization', 'users.scope_name', 'users.institution_id']);

        foreach ($adminUsers as $u) {
            if (empty($u->institution_id)) {
                $org = trim((string) ($u->organization ?: $u->scope_name ?: $u->name));
                if (! empty($org)) {
                    $matched = DB::table('institutions')
                        ->where('status', 'Aktif')
                        ->where(function ($q) use ($org) {
                            $q->where('name', 'LIKE', '%' . $org . '%')
                              ->orWhere('name', $org);
                        })
                        ->first(['id', 'name']);

                    if ($matched) {
                        DB::table('users')
                            ->where('id', $u->id)
                            ->update([
                                'institution_id' => $matched->id,
                                'organization' => $matched->name,
                                'scope_name' => $matched->name,
                            ]);
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('institutions') && Schema::hasColumn('institutions', 'is_priority_partner')) {
            Schema::table('institutions', function (Blueprint $table) {
                $table->dropColumn('is_priority_partner');
            });
        }
    }
};

