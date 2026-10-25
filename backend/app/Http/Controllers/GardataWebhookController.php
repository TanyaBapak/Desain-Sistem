<?php

namespace App\Http\Controllers;

use App\Jobs\SyncGardataPlacementData;
use App\Services\GardataPlacementSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class GardataWebhookController extends Controller
{
    public function __invoke(Request $request, GardataPlacementSyncService $syncService): JsonResponse
    {
        $configuredSecret = (string) (config('services.gardata.webhook_secret') ?: config('services.gardata.api_key'));

        if ($configuredSecret === '') {
            return response()->json([
                'status' => 'error',
                'message' => 'Konfigurasi webhook Gardata belum diatur di server.',
            ], 503);
        }

        $providedKey = $request->header('X-API-KEY')
            ?: $request->header('X-GARDATA-WEBHOOK-SECRET')
            ?: $request->bearerToken();

        if (! is_string($providedKey) || ! hash_equals($configuredSecret, $providedKey)) {
            return response()->json([
                'status' => 'unauthorized',
                'message' => 'Kunci otorisasi webhook tidak valid.',
            ], 401);
        }

        // Jika request meminta sinkronisasi langsung (sync=true)
        if ($request->boolean('sync')) {
            try {
                $result = $syncService->syncCandidates();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Sinkronisasi data Gardata berhasil diproses secara langsung.',
                    'data' => $result,
                ]);
            } catch (Throwable $e) {
                Log::error('Gagal memproses sinkronisasi langsung webhook Gardata', [
                    'error' => $e->getMessage(),
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal memproses sinkronisasi: ' . $e->getMessage(),
                ], 500);
            }
        }

        SyncGardataPlacementData::dispatch();

        return response()->json([
            'status' => 'success',
            'message' => 'Webhook diterima. Sinkronisasi data Gardata berhasil dijadwalkan.',
        ], 202);
    }
}
