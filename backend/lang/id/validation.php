<?php

return [
    'required' => ':attribute wajib diisi.',
    'array' => ':attribute harus berupa array.',
    'string' => ':attribute harus berupa teks.',
    'email' => ':attribute harus berupa alamat email yang valid.',
    'unique' => ':attribute ini sudah digunakan.',
    'exists' => ':attribute yang dipilih tidak valid.',
    'alpha_dash' => ':attribute hanya boleh berisi huruf, angka, tanda hubung (-), garis bawah (_), dan titik (.).',
    'regex' => 'Format :attribute tidak valid.',
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
        'username' => 'Nama pengguna',
        'name' => 'Nama lengkap',
        'email' => 'Alamat email',
        'password' => 'Kata sandi',
        'role' => 'Peran pengguna',
        'scopeLevel' => 'Tingkat lingkup',
        'scopeName' => 'Nama lingkup',
        'provinceId' => 'Provinsi',
        'districtId' => 'Kabupaten/kota',
        'institutionId' => 'Institusi vokasi',
        'institutionIds' => 'Daftar institusi vokasi',
        'employerId' => 'Pemberi kerja',
    ],
];
