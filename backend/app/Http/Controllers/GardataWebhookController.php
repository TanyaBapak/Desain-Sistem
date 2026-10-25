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
        $isSippmi = str_contains($request->path(), 'sippmi');
        $configuredSecret = (string) (
            $isSippmi
                ? (config('services.sippmi.webhook_secret') ?: config('services.sippmi.api_key') ?: config('services.gardata.webhook_secret') ?: config('services.gardata.api_key'))
                : (config('services.gardata.webhook_secret') ?: config('services.gardata.api_key') ?: config('services.sippmi.webhook_secret') ?: config('services.sippmi.api_key'))
        );

        if ($configuredSecret === '') {
            return response()->json([
                'status' => 'error',
                'message' => 'Konfigurasi webhook integrasi belum diatur di server.',
            ], 503);
        }

        $providedKey = $request->header('X-API-KEY')
            ?: $request->header('X-SIPPMI-WEBHOOK-SECRET')
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
                $result = $isSippmi ? $syncService->syncSippmi() : $syncService->syncCandidates();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Sinkronisasi data berhasil diproses secara langsung.',
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
