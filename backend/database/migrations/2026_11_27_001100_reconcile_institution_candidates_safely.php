<?php

use App\Services\CandidateInstitutionReconciliationService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Non-destructive migration: merekonsiliasi relasi foreign key dan nama institusi
     * pada data peserta (job_seekers) ke institusi vokasi yang sesuai secara 100% aman
     * tanpa menghapus satu baris data pun yang sudah ada.
     */
    public function up(): void
    {
        app(CandidateInstitutionReconciliationService::class)->reconcileAll(false);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak ada rollback destruktif demi menjaga integritas data.
    }
};
