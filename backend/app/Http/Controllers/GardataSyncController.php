<?php

namespace App\Http\Controllers;

use App\Jobs\SyncGardataPlacementData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class GardataSyncController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        abort_unless(
            in_array($request->user()->roles()->value('name'), ['super_admin', 'task_force', 'institution_admin'], true),
            403,
        );

        try {
            SyncGardataPlacementData::dispatchSync(true);
        } catch (Throwable $exception) {
            Log::error('Gardata synchronization dispatch failed.', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            return back()->withErrors([
                'gardata_sync' => 'Sinkronisasi Gardata gagal: ' . $exception->getMessage(),
            ]);
        }

        return back()->with('success', 'Sinkronisasi data Gardata berhasil diperbarui.');
    }
}
