<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicCommandCenterTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_command_center_is_rendered_on_home_page(): void
    {
        $this->withoutVite();

        $provinceId = '33';
        DB::table('provinces')->insert([
            'id' => $provinceId,
            'name' => 'Jawa Tengah',
        ]);

        $instId = 'inst-001';
        DB::table('institutions')->insert([
            'id' => $instId,
            'name' => 'LPK Vokasi Unggul Jawa Tengah',
            'institution_type' => 'LPK',
            'province_id' => $provinceId,
            'status' => 'Aktif',
            'evokasi_status' => 'Terverifikasi e-Vokasi',
            'supported_sectors' => json_encode(['Kesehatan']),
            'external_metadata' => json_encode([
                'sectorals' => [
                    ['sectoral' => 'Kesehatan', 'position' => 'Perawat'],
                ],
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('App')
                ->has('publicCommandCenter')
                ->where('publicCommandCenter.selectedProvince', 'all')
                ->where('publicCommandCenter.national.providersCount', 1)
                ->where('publicCommandCenter.national.registeredProvidersCount', 1)
                ->where('publicCommandCenter.previewDirectories.institutions.0.supportedSectors.0', 'Kesehatan')
                ->where('publicCommandCenter.previewDirectories.institutions.0.supportedOccupations.0', 'Perawat')
                ->has('publicCommandCenter.provinces', 38)
                ->has('publicCommandCenter.byProvince')
                ->has('publicCommandCenter.institutionsByProvince')
                ->has('publicCommandCenter.nationalLpkByProvince'));
    }

    public function test_public_command_center_can_filter_by_province(): void
    {
        $this->withoutVite();

        $jatengId = '33';
        $jabarId = '32';
        DB::table('provinces')->insert([
            ['id' => $jatengId, 'name' => 'Jawa Tengah'],
            ['id' => $jabarId, 'name' => 'Jawa Barat'],
        ]);

        DB::table('institutions')->insert([
            [
                'id' => 'inst-jt-1',
                'name' => 'LPK Semarang Vokasi',
                'institution_type' => 'LPK',
                'province_id' => $jatengId,
                'status' => 'Aktif',
                'evokasi_status' => 'Terverifikasi e-Vokasi',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'inst-jb-1',
                'name' => 'LPK Bandung Teknik',
                'institution_type' => 'LPK',
                'province_id' => $jabarId,
                'status' => 'Aktif',
                'evokasi_status' => 'Belum Terverifikasi',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->get('/?province=Jawa+Tengah')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('App')
                ->where('publicCommandCenter.selectedProvince', 'Jawa Tengah')
                ->where('publicCommandCenter.activeStats.scopeName', 'Jawa Tengah')
                ->where('publicCommandCenter.activeStats.providersCount', 1)
                ->where('publicCommandCenter.activeStats.registeredProvidersCount', 1)
                ->where('publicCommandCenter.national.providersCount', 2)
                ->where('publicCommandCenter.activeStats.programsCount', 3998));
    }
}
