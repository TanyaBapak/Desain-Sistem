<?php

return [
    'required' => 'The :attribute field is required.',
    'array' => 'The :attribute field must be an array.',
    'min' => [
        'numeric' => 'The :attribute field must be at least :min.',
        'file' => 'The :attribute field must be at least :min kilobytes.',
        'string' => 'The :attribute field must be at least :min characters.',
        'array' => 'The :attribute field must have at least :min items.',
    ],
    'max' => [
        'numeric' => 'The :attribute field must not be greater than :max.',
        'file' => 'The :attribute field must not be greater than :max kilobytes.',
        'string' => 'The :attribute field must not be greater than :max characters.',
        'array' => 'The :attribute field must not have more than :max items.',
    ],
    'attributes' => [
        'candidates' => 'candidates',
    ],
];
