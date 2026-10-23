<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'kp2mi' => [
        'base_url' => env('KP2MI_VOKASI_BASE_URL', 'https://vokasi.kp2mi.go.id'),
        'sync_page_size' => 36,
    ],

    'gardata' => [
        'base_url' => env('GARDATA_BASE_URL', 'https://gardata.sippmi.com'),
        'api_key' => env('GARDATA_API_KEY'),
        'sync_page_size' => (int) env('GARDATA_SYNC_PAGE_SIZE', 50),
        'max_pages' => (int) env('GARDATA_SYNC_MAX_PAGES', 1000),
    ],

];
