<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        @php
            $faviconUrl = asset('favicon.ico');
            if (file_exists(public_path('build/assets/logo-Do86rduN.png'))) {
                $faviconUrl = asset('build/assets/logo-Do86rduN.png');
            } elseif (file_exists(public_path('logo.png'))) {
                $faviconUrl = asset('logo.png');
            }

            // Robust manifest lookup supporting both standard Laravel and cPanel shared hosting structures
            $manifestCandidates = [
                public_path('build/manifest.json'),
                public_path('build/.vite/manifest.json'),
                base_path('public/build/manifest.json'),
                base_path('../public/build/manifest.json'),
                dirname(__DIR__, 2) . '/public/build/manifest.json',
            ];

            $manifestFile = null;
            foreach ($manifestCandidates as $candidate) {
                if (file_exists($candidate)) {
                    $manifestFile = $candidate;
                    break;
                }
            }

            $entryJs = null;
            $entryCss = null;
            $version = $manifestFile ? (string) filemtime($manifestFile) : (string) time();

            if ($manifestFile) {
                $manifestData = json_decode(file_get_contents($manifestFile), true);
                if (is_array($manifestData)) {
                    if (! empty($manifestData['resources/js/app.tsx']['file'])) {
                        $entryJs = $manifestData['resources/js/app.tsx']['file'];
                    }
                    if (! empty($manifestData['resources/js/app.tsx']['css'][0])) {
                        $entryCss = $manifestData['resources/js/app.tsx']['css'][0];
                    }
                }
            }

            // Fallback: pick the latest modified asset file (newest first, NOT alphabetical first)
            if (! $entryJs) {
                $allJs = glob(public_path('build/assets/app-*.js')) ?: [];
                if (! empty($allJs)) {
                    usort($allJs, fn($a, $b) => filemtime($b) <=> filemtime($a));
                    $entryJs = 'assets/' . basename($allJs[0]);
                    $version = (string) filemtime($allJs[0]);
                }
            }
            if (! $entryCss) {
                $allCss = glob(public_path('build/assets/app-*.css')) ?: [];
                if (! empty($allCss)) {
                    usort($allCss, fn($a, $b) => filemtime($b) <=> filemtime($a));
                    $entryCss = 'assets/' . basename($allCss[0]);
                }
            }
        @endphp
        <link rel="icon" type="image/png" href="{{ $faviconUrl }}">
        <title inertia>{{ config('app.name', 'SGG-AC') }}</title>

        @if(file_exists(public_path('hot')))
            @viteReactRefresh
            @vite('resources/js/app.tsx')
        @elseif($entryJs)
            @if($entryCss)
                <link rel="stylesheet" href="{{ asset('build/' . $entryCss) }}?v={{ $version }}">
            @endif
            <script type="module" src="{{ asset('build/' . $entryJs) }}?v={{ $version }}"></script>
        @else
            @viteReactRefresh
            @vite('resources/js/app.tsx')
        @endif

        @inertiaHead
    </head>
    <body class="min-h-screen overflow-x-hidden bg-background text-foreground">
        @inertia
    </body>
</html>
