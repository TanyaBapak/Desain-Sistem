<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class RincianPenambahanPesertaCommand extends Command
{
    protected $signature = 'candidates:rincian-penambahan
        {--output= : Path file output CSV (default: public/rincian_363_peserta.csv)}';

    protected $description = 'Ekstrak dan tampilkan rincian peserta tambahan di luar basis data 4.898/5.243 lengkap dengan nama, NIK, lembaga, dan ekspor ke CSV';

    public function handle(): int
    {
        $this->info('========================================================================');
        $this->info('   RINCIAN PESERTA TAMBAHAN / SINKRONISASI BASIS DATA SISTEM           ');
        $this->info('========================================================================');

        // 1. Ambil ID acuan dari roster murni (4.898 peserta)
        $rosterPath = database_path('data/real_candidates_roster_clean.json');
        if (! File::exists($rosterPath)) {
            $rosterPath = storage_path('app/reference/real_candidates_roster_clean.json');
        }
        $rosterList = File::exists($rosterPath) ? (json_decode(File::get($rosterPath), true) ?: []) : [];

        $kogasPath = database_path('data/kogas_real_candidates.json');
        $kogasList = File::exists($kogasPath) ? (json_decode(File::get($kogasPath), true) ?: []) : [];

        $baseCandidateIds = [];
        $occurrences = [];
        foreach ($rosterList as $c) {
            $name = trim((string) ($c['name'] ?? ''));
            $inst = trim((string) ($c['institution'] ?? ''));
            if ($name === '' || $inst === '') {
                continue;
            }
            $occurKey = mb_strtolower($name . '::' . $inst);
            $occurrences[$occurKey] = ($occurrences[$occurKey] ?? 0) + 1;
            $suffix = $occurrences[$occurKey] > 1 ? "::{$occurrences[$occurKey]}" : '';
            $candId = 'CAND-' . Str::upper(substr(hash('sha256', $name . '::' . $inst . $suffix), 0, 12));
            $baseCandidateIds[$candId] = true;
        }
        foreach ($kogasList as $kc) {
            $kid = $kc['id'] ?? ('CAND-' . Str::upper(substr(hash('sha256', ($kc['full_name'] ?? '') . '::CSV-7CPOPTMDGLEZ'), 0, 12)));
            $baseCandidateIds[$kid] = true;
        }

        // 2. Query seluruh peserta aktif di database
        $activeCandidates = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->leftJoin('districts', 'districts.id', '=', 'job_seekers.district_id')
            ->select([
                'job_seekers.id',
                'job_seekers.nik',
                'job_seekers.full_name',
                'job_seekers.gender',
                'job_seekers.institution_id',
                'job_seekers.institution_name',
                'provinces.name as province_name',
                'districts.name as district_name',
                'job_seekers.education_level',
                'job_seekers.major',
                'job_seekers.preferred_countries',
                'job_seekers.preferred_sectors',
                'job_seekers.created_by',
                'job_seekers.source_type',
                'job_seekers.created_at',
            ])
            ->orderBy('job_seekers.institution_name')
            ->orderBy('job_seekers.full_name')
            ->get();

        $totalActive = $activeCandidates->count();
        $this->info("Total Peserta Aktif di Database Saat Ini: {$totalActive} orang");

        // Pisahkan peserta tambahan (yang ID-nya di luar basis 4.898 murni)
        $additionalCandidates = $activeCandidates->filter(function ($c) use ($baseCandidateIds) {
            return ! isset($baseCandidateIds[$c->id]);
        });

        $totalAdditional = $additionalCandidates->count();
        $this->info("Total Peserta Tambahan Terdeteksi: {$totalAdditional} orang");

        // Rekapitulasi per Lembaga Vokasi
        $byInstitution = [];
        foreach ($additionalCandidates as $c) {
            $inst = trim((string) ($c->institution_name ?: 'Belum Terpetakan / Mandiri'));
            if (! isset($byInstitution[$inst])) {
                $byInstitution[$inst] = [
                    'count' => 0,
                    'province' => $c->province_name ?: '-',
                    'district' => $c->district_name ?: '-',
                    'samples' => [],
                ];
            }
            $byInstitution[$inst]['count']++;
            if (count($byInstitution[$inst]['samples']) < 5) {
                $byInstitution[$inst]['samples'][] = $c->full_name;
            }
        }

        $this->newLine();
        $this->info('REKAPITULASI PESERTA TAMBAHAN PER LEMBAGA VOKASI:');
        $tableRows = [];
        $no = 1;
        foreach ($byInstitution as $instName => $data) {
            $tableRows[] = [
                $no++,
                $instName,
                $data['province'] . ' / ' . $data['district'],
                $data['count'] . ' Peserta',
                implode(', ', $data['samples']) . ($data['count'] > 5 ? '... (+' . ($data['count'] - 5) . ' lainnya)' : ''),
            ];
        }
        $this->table(['No', 'Nama Lembaga Vokasi', 'Wilayah', 'Jumlah Peserta', 'Contoh Nama Siswa'], $tableRows);

        // Ekspor ke CSV
        $outputPath = $this->option('output') ?: public_path('rincian_363_peserta.csv');
        $csvDir = dirname($outputPath);
        if (! is_dir($csvDir)) {
            mkdir($csvDir, 0755, true);
        }

        $fp = fopen($outputPath, 'w');
        fputs($fp, "\xEF\xBB\xBF"); // BOM for Excel UTF-8
        fputcsv($fp, [
            'No',
            'ID Peserta',
            'NIK',
            'Nama Lengkap',
            'Jenis Kelamin',
            'Lembaga Vokasi Asal',
            'Provinsi Domisili',
            'Kabupaten / Kota',
            'Pendidikan',
            'Jurusan / Kejuruan',
            'Negara Target Preferensi',
            'Sektor Minat',
            'Didaftarkan Oleh',
            'Sumber Data',
            'Tanggal Terdaftar',
        ]);

        $exportNo = 1;
        foreach ($additionalCandidates as $c) {
            $countries = is_string($c->preferred_countries) ? json_decode($c->preferred_countries, true) : $c->preferred_countries;
            $countriesStr = is_array($countries) ? implode(', ', $countries) : (string) $c->preferred_countries;

            $sectors = is_string($c->preferred_sectors) ? json_decode($c->preferred_sectors, true) : $c->preferred_sectors;
            $sectorsStr = is_array($sectors) ? implode(', ', $sectors) : (string) $c->preferred_sectors;

            fputcsv($fp, [
                $exportNo++,
                $c->id,
                $c->nik ? (string) $c->nik : '-',
                $c->full_name,
                $c->gender,
                $c->institution_name ?: '-',
                $c->province_name ?: '-',
                $c->district_name ?: '-',
                $c->education_level ?: 'SMK',
                $c->major ?: '-',
                $countriesStr ?: 'Jepang',
                $sectorsStr ?: '-',
                $c->created_by ?: 'Administrator',
                $c->source_type ?: 'Lembaga Vokasi',
                $c->created_at ?: '-',
            ]);
        }
        fclose($fp);

        $this->newLine();
        $this->info("File rincian CSV berhasil dibuat di: {$outputPath}");
        $this->info("Dapat diunduh langsung lewat browser di: https://p2mi.sippmi.com/rincian_363_peserta.csv");

        return self::SUCCESS;
    }
}

