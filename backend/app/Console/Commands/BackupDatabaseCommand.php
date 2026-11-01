<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class BackupDatabaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup {--days=3 : Masa simpan arsip backup dalam hari sebelum otomatis dihapus}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backup database harian (kompresi gzip) dan otomatis hapus arsip yang berusia lebih dari 3 hari.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        if ($days <= 0) {
            $days = 3;
        }

        $this->info("Memulai proses backup database...");

        $backupDir = storage_path('app/backups');
        if (! File::isDirectory($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");

        if (! $dbConfig) {
            $this->error("Koneksi database '{$connection}' tidak ditemukan dalam konfigurasi.");
            Log::error("[db:backup] Koneksi '{$connection}' tidak ditemukan.");
            return Command::FAILURE;
        }

        $timestamp = Carbon::now('Asia/Jakarta')->format('Y-m-d_His');
        $dbName = $dbConfig['database'] ?? 'database';
        $safeDbName = preg_replace('/[^a-zA-Z0-9_-]/', '_', basename($dbName));
        $filename = "backup-{$safeDbName}-{$timestamp}.sql.gz";
        $filepath = "{$backupDir}/{$filename}";

        $driver = $dbConfig['driver'] ?? $connection;

        try {
            switch ($driver) {
                case 'mysql':
                case 'mariadb':
                    $this->backupMysql($dbConfig, $filepath);
                    break;

                case 'sqlite':
                    $this->backupSqlite($dbConfig, $filepath);
                    break;

                default:
                    $this->error("Driver database '{$driver}' belum didukung untuk backup otomatis.");
                    Log::error("[db:backup] Driver '{$driver}' belum didukung.");
                    return Command::FAILURE;
            }

            if (! File::exists($filepath) || File::size($filepath) <= 50) {
                $this->error("File backup gagal dibuat atau kosong.");
                Log::error("[db:backup] File backup gagal dibuat atau kosong: {$filepath}");
                if (File::exists($filepath)) {
                    File::delete($filepath);
                }
                return Command::FAILURE;
            }

            $sizeFormatted = $this->formatBytes(File::size($filepath));
            $this->info("✓ Backup database berhasil dibuat: {$filename} ({$sizeFormatted})");
            Log::info("[db:backup] Backup berhasil dibuat: {$filename} ({$sizeFormatted})");

            // Pembersihan backup lama (> $days hari)
            $this->pruneOldBackups($backupDir, $days);

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("Gagal melakukan backup database: " . $e->getMessage());
            Log::error("[db:backup] Exception: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            // Bersihkan file parsial jika gagal
            if (File::exists($filepath)) {
                File::delete($filepath);
            }

            return Command::FAILURE;
        }
    }

    /**
     * Backup MySQL / MariaDB via mariadb-dump / mysqldump dialirkan langsung ke gzip.
     */
    protected function backupMysql(array $config, string $filepath): void
    {
        $host = $config['host'] ?? '127.0.0.1';
        $port = (string) ($config['port'] ?? '3306');
        $user = $config['username'] ?? 'root';
        $password = $config['password'] ?? '';
        $database = $config['database'] ?? '';

        $dumpBinary = 'mysqldump';
        if (File::exists('/usr/bin/mariadb-dump')) {
            $dumpBinary = '/usr/bin/mariadb-dump';
        } elseif (File::exists('/usr/bin/mysqldump')) {
            $dumpBinary = '/usr/bin/mysqldump';
        }

        $gz = gzopen($filepath, 'wb9');
        if (! $gz) {
            throw new \RuntimeException("Tidak dapat membuka file tujuan: {$filepath}");
        }

        try {
            $command = [
                $dumpBinary,
                '-h', $host,
                '-P', $port,
                '-u', $user,
                "-p{$password}",
                '--quick',
                '--single-transaction',
                $database,
            ];

            $process = new Process($command);
            $process->setTimeout(600); // 10 menit

            $process->run(function (string $type, string $buffer) use ($gz): void {
                if ($type === Process::OUT) {
                    gzwrite($gz, $buffer);
                }
            });

            if (! $process->isSuccessful()) {
                $err = trim($process->getErrorOutput());
                throw new \RuntimeException("Proses dump gagal [kode {$process->getExitCode()}]: {$err}");
            }
        } finally {
            gzclose($gz);
        }
    }

    /**
     * Backup SQLite via gzopen stream.
     */
    protected function backupSqlite(array $config, string $filepath): void
    {
        $dbPath = $config['database'] ?? '';
        if (! File::exists($dbPath)) {
            throw new \RuntimeException("File SQLite tidak ditemukan di: {$dbPath}");
        }

        $source = fopen($dbPath, 'rb');
        $gz = gzopen($filepath, 'wb9');

        if (! $source || ! $gz) {
            if ($source) fclose($source);
            if ($gz) gzclose($gz);
            throw new \RuntimeException("Gagal membuka stream file SQLite.");
        }

        try {
            while (! feof($source)) {
                $chunk = fread($source, 65536);
                if ($chunk !== false) {
                    gzwrite($gz, $chunk);
                }
            }
        } finally {
            fclose($source);
            gzclose($gz);
        }
    }

    /**
     * Hapus file backup yang berusia lebih dari $days hari (default 3 hari).
     */
    protected function pruneOldBackups(string $backupDir, int $days): void
    {
        $this->info("Memeriksa backup lama yang berusia lebih dari {$days} hari...");
        $files = File::glob("{$backupDir}/backup-*.sql.gz");
        $cutoffTime = Carbon::now('Asia/Jakarta')->subDays($days)->getTimestamp();
        $deletedCount = 0;

        foreach ($files as $file) {
            $mtime = File::lastModified($file);
            if ($mtime < $cutoffTime) {
                $baseName = basename($file);
                File::delete($file);
                $deletedCount++;
                $this->line(" - Dihapus: {$baseName} (arsip lawas)");
                Log::info("[db:backup] Menghapus backup lama (> {$days} hari): {$baseName}");
            }
        }

        $remainingCount = count(File::glob("{$backupDir}/backup-*.sql.gz"));
        $this->info("Pembersihan selesai: {$deletedCount} file dihapus, {$remainingCount} file backup tersisa.");
        Log::info("[db:backup] Pembersihan selesai: {$deletedCount} dihapus, {$remainingCount} tersisa.");
    }

    /**
     * Format byte ukuran file.
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
