<?php

namespace App\Console\Commands;

use App\Services\CandidateInstitutionReconciliationService;
use Illuminate\Console\Command;

class ReconcileInstitutionCandidatesCommand extends Command
{
    protected $signature = 'sippmi:reconcile-institution-candidates
        {--dry-run : Pratinjau rekonsiliasi tanpa melakukan perubahan database}';

    protected $description = 'Rekonsiliasi data peserta (job_seekers) ke institusi vokasi berdasarkan akun pengguna dan entitas pembuat';

    public function handle(CandidateInstitutionReconciliationService $service): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info('================================================================');
        $this->info('   REKONSILIASI DATA PESERTA KE LEMBAGA / VOKASI TERPILIH      ');
        $this->info('================================================================');

        if ($dryRun) {
            $this->warn('Mode: DRY RUN — tidak ada data yang diubah di database.');
        }

        $result = $service->reconcileAll($dryRun);

        $this->line('');
        $this->line("Total peserta dalam database : {$result['total_processed']} orang");
        $this->line("Peserta yang direkonsiliasi  : {$result['total_reconciled']} orang");
        $this->line("Institusi yang terdampak     : {$result['institutions_affected']} lembaga");
        $this->line('');

        if (! empty($result['details'])) {
            $headers = ['ID Lembaga', 'Nama Lembaga Vokasi', 'Peserta Direkonsiliasi'];
            $rows = [];
            foreach ($result['details'] as $instId => $info) {
                $rows[] = [$instId, $info['name'], $info['count']];
            }
            $this->table($headers, $rows);
        } else {
            $this->info('Semua data peserta sudah sinkron dengan institusi yang sesuai.');
        }

        $this->info('');
        $this->info('Proses rekonsiliasi selesai dengan sukses.');

        return Command::SUCCESS;
    }
}
