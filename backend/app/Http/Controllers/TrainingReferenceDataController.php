<?php

namespace App\Http\Controllers;

use App\Services\BusinessDataPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TrainingReferenceDataController extends Controller
{
    public function storeSector(Request $request, BusinessDataPresenter $businessDataPresenter): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150', 'unique:sectors,name'],
            'aliases' => ['nullable', 'array', 'max:30'],
            'aliases.*' => ['required', 'string', 'max:150'],
        ]);
        $id = 'SECT-'.Str::upper(Str::random(12));

        DB::transaction(function () use ($request, $data, $id): void {
            DB::table('sectors')->insert([
                'id' => $id,
                'name' => trim($data['name']),
                'aliases' => json_encode($this->normalizeAliases($data['aliases'] ?? []), JSON_THROW_ON_ERROR),
            ]);
            $this->writeAudit($request, 'sectors', $id, 'INPUT_DATA', null, $data);
        });

        $businessDataPresenter->forgetAll();

        return back()->with('success', 'Sektor berhasil ditambahkan.');
    }

    public function updateSector(
        Request $request,
        string $sectorId,
        BusinessDataPresenter $businessDataPresenter,
    ): RedirectResponse {
        $this->authorizeSuperAdmin($request);
        $sector = DB::table('sectors')->where('id', $sectorId)->first();
        abort_unless($sector, 404);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150', Rule::unique('sectors', 'name')->ignore($sectorId, 'id')],
            'aliases' => ['nullable', 'array', 'max:30'],
            'aliases.*' => ['required', 'string', 'max:150'],
        ]);
        $aliases = $this->normalizeAliases($data['aliases'] ?? []);
        if (trim($sector->name) !== trim($data['name'])) {
            $aliases = $this->normalizeAliases([...$aliases, $sector->name]);
        }

        DB::transaction(function () use ($request, $sector, $sectorId, $data, $aliases): void {
            DB::table('sectors')->where('id', $sectorId)->update([
                'name' => trim($data['name']),
                'aliases' => json_encode($aliases, JSON_THROW_ON_ERROR),
            ]);
            $this->writeAudit($request, 'sectors', $sectorId, 'UPDATE_DATA', $sector, [
                'name' => trim($data['name']),
                'aliases' => $aliases,
            ]);
        });

        $businessDataPresenter->forgetAll();

        return back()->with('success', 'Sektor berhasil diperbarui.');
    }

    public function storeOccupation(Request $request, BusinessDataPresenter $businessDataPresenter): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);
        $data = $request->validate([
            'sectorId' => ['required', 'string', 'exists:sectors,id'],
            'title' => [
                'required',
                'string',
                'max:150',
                Rule::unique('occupations', 'title')->where('sector_id', $request->input('sectorId')),
            ],
            'aliases' => ['nullable', 'array', 'max:30'],
            'aliases.*' => ['required', 'string', 'max:150'],
        ]);
        $id = 'OCC-'.Str::upper(Str::random(12));

        DB::transaction(function () use ($request, $data, $id): void {
            DB::table('occupations')->insert([
                'id' => $id,
                'sector_id' => $data['sectorId'],
                'title' => trim($data['title']),
                'aliases' => json_encode($this->normalizeAliases($data['aliases'] ?? []), JSON_THROW_ON_ERROR),
            ]);
            $this->writeAudit($request, 'occupations', $id, 'INPUT_DATA', null, $data);
        });

        $businessDataPresenter->forgetAll();

        return back()->with('success', 'Jabatan berhasil ditambahkan.');
    }

    public function updateOccupation(
        Request $request,
        string $occupationId,
        BusinessDataPresenter $businessDataPresenter,
    ): RedirectResponse {
        $this->authorizeSuperAdmin($request);
        $occupation = DB::table('occupations')->where('id', $occupationId)->first();
        abort_unless($occupation, 404);
        $data = $request->validate([
            'sectorId' => ['required', 'string', 'exists:sectors,id'],
            'title' => [
                'required',
                'string',
                'max:150',
                Rule::unique('occupations', 'title')
                    ->where('sector_id', $request->input('sectorId'))
                    ->ignore($occupationId, 'id'),
            ],
            'aliases' => ['nullable', 'array', 'max:30'],
            'aliases.*' => ['required', 'string', 'max:150'],
        ]);
        $aliases = $this->normalizeAliases($data['aliases'] ?? []);
        if (trim($occupation->title) !== trim($data['title'])) {
            $aliases = $this->normalizeAliases([...$aliases, $occupation->title]);
        }

        DB::transaction(function () use ($request, $occupation, $occupationId, $data, $aliases): void {
            DB::table('occupations')->where('id', $occupationId)->update([
                'sector_id' => $data['sectorId'],
                'title' => trim($data['title']),
                'aliases' => json_encode($aliases, JSON_THROW_ON_ERROR),
            ]);
            $this->writeAudit($request, 'occupations', $occupationId, 'UPDATE_DATA', $occupation, [
                'sectorId' => $data['sectorId'],
                'title' => trim($data['title']),
                'aliases' => $aliases,
            ]);
        });

        $businessDataPresenter->forgetAll();

        return back()->with('success', 'Jabatan berhasil diperbarui.');
    }

    private function authorizeSuperAdmin(Request $request): void
    {
        abort_unless($request->user()?->roles()->where('name', 'super_admin')->exists(), 403);
    }

    /**
     * @param  list<string>  $aliases
     * @return list<string>
     */
    private function normalizeAliases(array $aliases): array
    {
        return array_values(array_unique(array_filter(
            array_map(static fn (string $alias): string => trim($alias), $aliases),
            static fn (string $alias): bool => $alias !== '',
        )));
    }

    private function writeAudit(
        Request $request,
        string $entity,
        string $entityId,
        string $action,
        ?object $oldValue,
        array $newValue,
    ): void {
        $user = $request->user();
        DB::table('audit_logs')->insert([
            'id' => 'AUD-'.Str::upper(Str::random(20)),
            'user_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->roles()->value('title') ?? 'Super Admin',
            'scope' => 'Nasional',
            'action_type' => $action,
            'entity' => $entity,
            'entity_id' => $entityId,
            'old_value' => $oldValue ? json_encode($oldValue, JSON_THROW_ON_ERROR) : null,
            'new_value' => json_encode($newValue, JSON_THROW_ON_ERROR),
            'justification_reason' => 'Data master sektor atau jabatan diperbarui.',
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
        ]);
    }
}
