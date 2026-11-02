<?php

namespace App\Console\Commands;

use App\Services\CandidateInstitutionReconciliationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

class RestoreDatabaseCommand extends Command
{
    protected $signature = 'db:restore
        {file? : Path ke berkas .sql atau .sql.gz yang ingin direstore}
        {--force : Jalankan tanpa konfirmasi interaktif}
        {--no-reconcile : Jangan jalankan rekonsiliasi data peserta setelah restore}';

    protected $description = 'Restore database dari berkas backup (.sql atau .sql.gz) dan rekonsiliasi data peserta';

    public function handle(CandidateInstitutionReconciliationService $reconciliationService): int
    {
        $filePath = $this->argument('file');

        if (! $filePath) {
            // Cari file dump backup di root workspace atau di storage/app/backups
            $candidates = [
                base_path('../backup-smk_goglobal-2026-11-02_162515.sql.gz'),
                base_path('backup-smk_goglobal-2026-11-02_162515.sql.gz'),
                storage_path('app/backups/backup-smk_goglobal-2026-11-02_162515.sql.gz'),
            ];

            foreach ($candidates as $candidate) {
                if (File::exists($candidate)) {
                    $filePath = $candidate;
                    break;
                }
            }

            if (! $filePath) {
                // Cari file .sql.gz terbaru di storage/app/backups
                $backupFiles = File::glob(storage_path('app/backups/*.sql.gz'));
                if (! empty($backupFiles)) {
                    rsort($backupFiles);
                    $filePath = $backupFiles[0];
                }
            }
        }

        if (! $filePath || ! File::exists($filePath)) {
            $this->error("Berkas backup database tidak ditemukan: {$filePath}");
            return Command::FAILURE;
        }

        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");

        if (! $dbConfig) {
            $this->error("Konfigurasi database untuk koneksi '{$connection}' tidak ditemukan.");
            return Command::FAILURE;
        }

        $dbName = $dbConfig['database'] ?? '';
        $this->warn("Target Database: {$dbName} (Host: {$dbConfig['host']}, Port: {$dbConfig['port']})");
        $this->info("Berkas Sumber  : " . realpath($filePath));

        if (! $this->option('force')) {
            if (! $this->confirm("Apakah Anda yakin ingin memulihkan (restore) data dari berkas ini ke database '{$dbName}'?", false)) {
                $this->info("Proses restore dibatalkan.");
                return Command::SUCCESS;
            }
        }

        $this->info("Memulai pemulihan database...");

        $host = $dbConfig['host'] ?? '127.0.0.1';
        $port = (string) ($dbConfig['port'] ?? '3306');
        $user = $dbConfig['username'] ?? 'root';
        $password = $dbConfig['password'] ?? '';

        $mysqlBinary = 'mysql';
        $knownPaths = [
            '/Users/it/.local/mysql/bin/mysql',
            '/usr/local/mysql/bin/mysql',
            '/opt/homebrew/bin/mysql',
            '/usr/bin/mysql',
            '/usr/local/bin/mysql',
        ];
        foreach ($knownPaths as $p) {
            if (File::exists($p)) {
                $mysqlBinary = $p;
                break;
            }
        }

        $isGz = str_ends_with(strtolower($filePath), '.gz');

        if ($isGz) {
            $cmd = sprintf(
                'gzip -dc %s | %s -h %s -P %s -u %s %s %s',
                escapeshellarg($filePath),
                escapeshellarg($mysqlBinary),
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($user),
                $password !== '' ? '-p'.escapeshellarg($password) : '',
                escapeshellarg($dbName)
            );
        } else {
            $cmd = sprintf(
                '%s -h %s -P %s -u %s %s %s < %s',
                escapeshellarg($mysqlBinary),
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($user),
                $password !== '' ? '-p'.escapeshellarg($password) : '',
                escapeshellarg($dbName),
                escapeshellarg($filePath)
            );
        }

        $process = Process::fromShellCommandline($cmd);
        $process->setTimeout(600);
        $process->run();

        if (! $process->isSuccessful()) {
            $this->error("Gagal melakukan restore database: " . $process->getErrorOutput());
            return Command::FAILURE;
        }

        $this->info("✓ Database berhasil dipulihkan dari berkas backup.");

        if (! $this->option('no-reconcile')) {
            $this->line("");
            $this->info("Menjalankan rekonsiliasi data peserta secara otomatis...");
            $result = $reconciliationService->reconcileAll(false);
            $this->info("✓ Rekonsiliasi selesai: {$result['total_reconciled']} peserta berhasil dihubungkan ke institusi vokasi masing-masing.");
        }

        return Command::SUCCESS;
    }
}
