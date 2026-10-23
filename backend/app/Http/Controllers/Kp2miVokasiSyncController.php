<?php

namespace App\Http\Controllers;

use App\Services\Kp2miVokasiSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class Kp2miVokasiSyncController extends Controller
{
    public function __invoke(Request $request, Kp2miVokasiSyncService $syncService): RedirectResponse
    {
        abort_unless(
            in_array($request->user()->roles()->value('name'), ['super_admin', 'task_force', 'directorate_admin'], true),
            403,
        );

        try {
            $result = $syncService->syncFirstPage();
        } catch (Throwable $exception) {
            Log::error('KP2MI institution synchronization failed.', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            return back()->withErrors([
                'sync' => 'Sinkronisasi KP2MI gagal. Periksa koneksi atau coba kembali beberapa saat lagi.',
            ]);
        }

        return back()->with('success', sprintf(
            'Sinkronisasi selesai: %d data baru, %d diperbarui, dan %d dilewati.',
            $result['recordsInserted'],
            $result['recordsUpdated'],
            $result['recordsSkipped'],
        ));
    }
}
