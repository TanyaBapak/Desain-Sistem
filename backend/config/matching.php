<?php

return [
    'algorithm_version' => env('MATCHING_ALGORITHM_VERSION', 'v1.0'),
    'minimum_score' => (float) env('MATCHING_MINIMUM_SCORE', 40),
    'weights' => [
        'occupation' => (float) env('MATCHING_WEIGHT_OCCUPATION', 25),
        'education' => (float) env('MATCHING_WEIGHT_EDUCATION', 15),
        'country' => (float) env('MATCHING_WEIGHT_COUNTRY', 15),
        'sector' => (float) env('MATCHING_WEIGHT_SECTOR', 15),
        'skills' => (float) env('MATCHING_WEIGHT_SKILLS', 15),
        'language' => (float) env('MATCHING_WEIGHT_LANGUAGE', 10),
        'certification' => (float) env('MATCHING_WEIGHT_CERTIFICATION', 5),
    ],
];
