<?php

return [
    'required' => ':attribute wajib diisi.',
    'array' => ':attribute harus berupa array.',
    'min' => [
        'numeric' => ':attribute minimal bernilai :min.',
        'file' => ':attribute minimal berukuran :min kilobita.',
        'string' => ':attribute minimal berisi :min karakter.',
        'array' => ':attribute minimal memiliki :min item.',
    ],
    'max' => [
        'numeric' => ':attribute tidak boleh lebih dari :max.',
        'file' => ':attribute tidak boleh lebih besar dari :max kilobita.',
        'string' => ':attribute tidak boleh lebih dari :max karakter.',
        'array' => ':attribute tidak boleh lebih dari :max item.',
    ],
    'attributes' => [
        'candidates' => 'Data calon peserta',
    ],
];

