<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class SyncVokasiSpreadsheetCommand extends Command
{
    protected $signature = 'institutions:import-excel
                            {file? : Path file Excel .xlsx (opsional, jika tidak ada akan otomatis ditarik dari Google Drive)}
                            {--drive-id=1i7Ofz4Pl_KxIuUb-vWUnizUv-OqWS2Aj : ID file Google Drive}
                            {--dry-run : Hanya validasi data tanpa menulis ke database}';

    protected $description = 'Konversi dan import data lembaga vokasi dari spreadsheet Google Drive / Excel (.xlsx) ke database';

    public function handle(): int
    {
        $file = $this->argument('file');
        $driveId = $this->option('drive-id') ?: '1i7Ofz4Pl_KxIuUb-vWUnizUv-OqWS2Aj';

        $xlsxPath = $file ? base_path($file) : null;

        if (! $xlsxPath || ! is_file($xlsxPath)) {
            $defaultPaths = [
                storage_path('app/dashboard-full.xlsx'),
                storage_path('app/dashboard-full-2026-10-24-17-19-06.xlsx'),
                base_path('../scratch/dashboard-full.xlsx'),
            ];

            foreach ($defaultPaths as $path) {
                if (is_file($path)) {
                    $xlsxPath = $path;
                    break;
                }
            }
        }

        if (! $xlsxPath || ! is_file($xlsxPath)) {
            $this->info("Mengunduh file Excel vokasi dari Google Drive (ID: {$driveId})...");
            $targetDownload = storage_path('app/dashboard-full.xlsx');
            if (! is_dir(dirname($targetDownload))) {
                mkdir(dirname($targetDownload), 0755, true);
            }

            $downloadUrl = "https://drive.usercontent.google.com/download?id={$driveId}&export=download&confirm=t";
            $cmd = sprintf('curl -L -o %s %s', escapeshellarg($targetDownload), escapeshellarg($downloadUrl));
            
            $this->line("Menjalankan: curl...");
            exec($cmd, $output, $returnCode);

            if ($returnCode !== 0 || ! is_file($targetDownload) || filesize($targetDownload) < 100000) {
                $this->error("Gagal mengunduh file Excel dari Google Drive secara otomatis. Silakan upload file .xlsx ke storage/app/dashboard-full.xlsx.");
                return self::FAILURE;
            }

            $xlsxPath = $targetDownload;
            $this->info("Unduhan selesai: " . round(filesize($xlsxPath) / 1024 / 1024, 2) . " MB.");
        }

        $this->info("Menggunakan sumber data: {$xlsxPath}");

        $outCsvPath = storage_path('app/data_vokasi.csv');
        $scriptPath = base_path('scripts/convert_vokasi_spreadsheet.py');

        if (! is_file($scriptPath)) {
            $this->error("Script konverter tidak ditemukan di: {$scriptPath}");
            return self::FAILURE;
        }

        $this->info("Menjalankan konversi sheet 'Pendataan' dan 'Pendataan Relations' ke CSV standar...");
        $pythonBinary = PHP_OS_FAMILY === 'Windows' ? 'python' : 'python3';
        $convertProcess = new Process([$pythonBinary, $scriptPath, $xlsxPath, $outCsvPath]);
        $convertProcess->setTimeout(300);
        $convertProcess->run(function ($type, $buffer) {
            $this->output->write($buffer);
        });

        if (! $convertProcess->isSuccessful() || ! is_file($outCsvPath)) {
            $this->error("Proses konversi Excel ke CSV gagal.");
            return self::FAILURE;
        }

        $this->info("Menjalankan import data lembaga vokasi ke database...");
        $importArgs = ['file' => 'storage/app/data_vokasi.csv'];
        if ($this->option('dry-run')) {
            $importArgs['--dry-run'] = true;
        }

        return $this->call('institutions:import-vokasi', $importArgs);
    }
}
