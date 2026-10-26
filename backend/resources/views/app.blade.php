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
        @endphp
        <link rel="icon" type="image/png" href="{{ $faviconUrl }}">
        <title inertia>{{ config('app.name', 'SGG-AC') }}</title>
        @if(file_exists(public_path('hot')) || file_exists(public_path('build/manifest.json')))
            @viteReactRefresh
            @vite('resources/js/app.tsx')
        @else
            @php
                $cssFile = collect(glob(public_path('build/assets/app-*.css')))->first();
                $jsFile = collect(glob(public_path('build/assets/app-*.js')))->first();
            @endphp
            @if($cssFile)
                <link rel="stylesheet" href="{{ asset('build/assets/' . basename($cssFile)) }}">
            @endif
            @if($jsFile)
                <script type="module" src="{{ asset('build/assets/' . basename($jsFile)) }}"></script>
            @endif
        @endif
        @inertiaHead
    </head>
    <body class="min-h-screen overflow-x-hidden bg-background text-foreground">
        @inertia
    </body>
</html>
