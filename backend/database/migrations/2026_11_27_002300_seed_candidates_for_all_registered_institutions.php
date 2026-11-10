<?php

use App\Models\User;
use App\Services\BusinessDataPresenter;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $presenter = app(BusinessDataPresenter::class);

        // 1. Ambil seluruh pengguna lembaga vokasi
        $vokasiUsers = User::query()
            ->where(function ($q) {
                $q->where('scope_level', 'lembaga')
                    ->orWhereNotNull('institution_id')
                    ->orWhereHas('roles', function ($rq) {
                        $rq->whereIn('name', ['institution_admin', 'vokasi', 'lembaga_vokasi', 'training_operator']);
                    });
            })
            ->get();

        foreach ($vokasiUsers as $u) {
            try {
                $scope = $presenter->resolveInstitutionScope($u);
                $presenter->ensureInstitutionCandidates(
                    $scope['patterns'] ?? [],
                    $scope['institution']?->id ?? $u->institution_id,
                    $u
                );
            } catch (\Throwable $e) {
                \Log::warning("Migration seed candidates error for user {$u->id}: " . $e->getMessage());
            }
        }

        // 2. Jaminan eksplisit untuk LPKS KOGAS NUSANTARA (tepat 40 peserta sesuai memori input vokasi)
        $kogasCount = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->where('institution_id', 'CSV-7CPOPTMDGLEZ')
                    ->orWhere('institution_name', 'LIKE', '%KOGAS%')
                    ->orWhere('institution_name', 'LIKE', '%Kogas%')
                    ->orWhere('created_by', 'SUPRIYANTO');
            })
            ->count();

        if ($kogasCount < 40) {
            $supriyanto = User::find(19) ?? User::where('email', 'kogasnusantaramadiun@gmail.com')->first();
            if ($supriyanto) {
                $scope = $presenter->resolveInstitutionScope($supriyanto);
                $presenter->ensureInstitutionCandidates(
                    ['LPKS KOGAS NUSANTARA', 'Kogas Nusantara', 'LPK Kogas Nusantara'],
                    'CSV-7CPOPTMDGLEZ',
                    $supriyanto
                );
            }
        }

        // 3. Jaminan eksplisit untuk LPK Bunga Bangsa Insan Mandiri
        $bungaCount = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->where('institution_id', 'VOC-HUJSOCNCTIGV')
                    ->orWhere('institution_name', 'LIKE', '%Bunga Bangsa%')
                    ->orWhere('created_by', 'Faisal');
            })
            ->count();

        if ($bungaCount < 35) {
            $faisal = User::find(61) ?? User::where('email', 'LPKBungaBangsaInsanMandiri@gmail.com')->first();
            if ($faisal) {
                $scope = $presenter->resolveInstitutionScope($faisal);
                $presenter->ensureInstitutionCandidates(
                    ['LPK Bunga Bangsa Insan Mandiri', 'Bunga Bangsa Insan Mandiri', 'Bunga Bangsa'],
                    'VOC-HUJSOCNCTIGV',
                    $faisal
                );
            }
        }

        // 4. Pastikan lembaga terkait aktif dan terverifikasi
        DB::table('institutions')
            ->whereIn('id', function ($q) {
                $q->select('institution_id')
                    ->from('job_seekers')
                    ->whereNotNull('institution_id')
                    ->whereNull('deleted_at');
            })
            ->update([
                'is_priority_partner' => 1,
                'status' => 'Aktif',
                'verification_status' => 'Verified',
                'updated_at' => now(),
            ]);

        // 5. Bersihkan cache
        try {
            $presenter->forgetAll();
        } catch (\Throwable) {}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
