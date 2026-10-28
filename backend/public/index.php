<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

@ini_set('memory_limit', '512M');
@set_time_limit(120);

// Determine backend base directory dynamically
$backendDir = __DIR__ . '/..';
if (! file_exists($backendDir . '/vendor/autoload.php')) {
    if (file_exists(__DIR__ . '/../private/Desain-Sistem/backend/vendor/autoload.php')) {
        $backendDir = __DIR__ . '/../private/Desain-Sistem/backend';
    } elseif (file_exists(__DIR__ . '/private/Desain-Sistem/backend/vendor/autoload.php')) {
        $backendDir = __DIR__ . '/private/Desain-Sistem/backend';
    }
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = $backendDir . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require $backendDir . '/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once $backendDir . '/bootstrap/app.php';

$app->handleRequest(Request::capture());
