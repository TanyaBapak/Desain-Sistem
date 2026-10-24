<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InstitutionRegistrationController extends Controller
{
    public function create(): Response|RedirectResponse
    {
        if (auth()->check()) {
            return redirect()->route('home');
        }

        return Inertia::render('App', [
            'currentTab' => 'overview',
            'isRoot' => true,
            'showLogin' => false,
            'showInstitutionRegistration' => true,
            'registrationStatus' => null,
            'registrationOptions' => [
                'provinces' => DB::table('provinces')->orderBy('name')->get(['id', 'name']),
                'districts' => DB::table('districts')->orderBy('name')->get(['id', 'province_id', 'name']),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'institutionName' => ['required', 'string', 'max:255'],
            'institutionType' => ['required', Rule::in(['SMK', 'BLK', 'LPK', 'LKP', 'Perguruan Tinggi / Politeknik'])],
            'ownershipType' => ['required', Rule::in(['Negeri', 'Swasta'])],
            'registrationNumber' => ['required', 'string', 'max:50', Rule::unique('institutions', 'npsn_or_vin')],
            'provinceId' => ['required', 'string', 'exists:provinces,id'],
            'districtId' => ['required', 'string', Rule::exists('districts', 'id')->where('province_id', $request->input('provinceId'))],
            'address' => ['required', 'string', 'max:2000'],
            'headName' => ['required', 'string', 'max:150'],
            'contactEmail' => ['required', 'email', 'max:150', 'unique:users,email'],
            'contactPhone' => ['required', 'string', 'max:50'],
            'accreditation' => ['nullable', 'string', 'max:50'],
            'procurementMethod' => ['required', Rule::in(['Swakelola Tipe 2', 'Swakelola Tipe 3', 'E-purchasing'])],
            'instructorCount' => ['required', 'integer', 'min:0', 'max:100000'],
            'batchCapacity' => ['required', 'integer', 'min:0', 'max:100000'],
            'supportedSectors' => ['required', 'string', 'max:1000'],
            'password' => ['required', 'string', 'min:10', 'max:255', 'confirmed'],
            'consent' => ['accepted'],
        ], [
            'districtId.exists' => 'Kabupaten/kota harus berada di provinsi yang dipilih.',
            'registrationNumber.unique' => 'Nomor identitas lembaga tersebut sudah terdaftar.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ]);

        $role = Role::query()->where('name', 'institution_admin')->firstOrFail();
        $institutionId = 'VOC-'.Str::upper(Str::random(12));

        DB::transaction(function () use ($data, $role, $institutionId): void {
            $now = now();
            $provinceName = (string) DB::table('provinces')->where('id', $data['provinceId'])->value('name');
            $district = DB::table('districts')->where('id', $data['districtId'])->first();
            $sectors = collect(explode(',', $data['supportedSectors']))
                ->map(fn (string $sector): string => trim($sector))
                ->filter()
                ->unique()
                ->values()
                ->all();

            DB::table('institutions')->insert([
                'id' => $institutionId,
                'name' => $data['institutionName'],
                'npsn_or_vin' => $data['registrationNumber'],
                'institution_type' => $data['institutionType'],
                'ownership_type' => $data['ownershipType'],
                'province_id' => $data['provinceId'],
                'district_id' => $data['districtId'],
                'address' => $data['address'],
                'head_name' => $data['headName'],
                'phone' => $data['contactPhone'],
                'email' => $data['contactEmail'],
                'accreditation' => $data['accreditation'] ?: 'Belum ada',
                'procurement_method' => $data['procurementMethod'],
                'evokasi_status' => 'Belum Terverifikasi',
                'instructor_count' => $data['instructorCount'],
                'workshop_capacity' => $data['batchCapacity'],
                'verification_status' => 'Pending Verification',
                'status' => 'Aktif',
                'supported_sectors' => json_encode($sectors, JSON_THROW_ON_ERROR),
                'registration_consented_at' => $now,
                'registration_consent_version' => '2026-10-v1',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $usernameBase = Str::slug(Str::before($data['contactEmail'], '@'), '.');
            $username = Str::limit($usernameBase, 80, '').'.'.Str::lower(Str::random(8));
            $user = User::query()->create([
                'user_code' => 'USR-'.Str::upper(Str::random(10)),
                'name' => $data['headName'],
                'username' => $username,
                'email' => $data['contactEmail'],
                'password' => Hash::make($data['password']),
                'organization' => $data['institutionName'],
                'scope_level' => 'lembaga',
                'scope_name' => trim($district->name.', '.$provinceName),
                'province_id' => $data['provinceId'],
                'district_id' => $data['districtId'],
                'institution_id' => $institutionId,
                'status' => 'Ditangguhkan',
                'avatar_initials' => Str::upper(Str::substr($data['headName'], 0, 2)),
            ]);
            $user->roles()->sync([$role->id]);

            $approvalId = 'APP-'.Str::upper(Str::random(20));
            DB::table('approval_requests')->insert([
                'id' => $approvalId,
                'entity_type' => 'lembaga_vokasi',
                'entity_id' => $institutionId,
                'title' => 'Pendaftaran lembaga vokasi: '.$data['institutionName'],
                'submitted_by' => $data['headName'],
                'submitted_role' => 'institution_admin',
                'scope_label' => trim($district->name.', '.$provinceName),
                'submitted_at' => $now,
                'validation_status' => 'PASSED',
                'status' => 'PENDING',
                'data_snapshot' => json_encode(['source' => 'self_registration'], JSON_THROW_ON_ERROR),
            ]);
            DB::table('approval_histories')->insert([
                'approval_request_id' => $approvalId,
                'actor_id' => $user->id,
                'actor_name' => $data['headName'],
                'action' => 'SUBMIT',
                'notes' => 'Pendaftaran mandiri menunggu verifikasi.',
                'created_at' => $now,
            ]);

        });

        return redirect()->route('login')->with('status', 'Pendaftaran berhasil dikirim. Akun dapat digunakan setelah lembaga diverifikasi.');
    }
}
