<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link rel="icon" type="image/png" href="{{ Vite::asset('../public/logo.png') }}">
        <title inertia>{{ config('app.name', 'SGG-AC') }}</title>
        @viteReactRefresh
        @vite('resources/js/app.tsx')
        @inertiaHead
    </head>
    <body class="min-h-screen overflow-x-hidden bg-background text-foreground">
        @inertia
    </body>
</html>
