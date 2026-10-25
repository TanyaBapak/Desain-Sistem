#!/usr/bin/env python3
import sys
import os
import zipfile
import xml.etree.ElementTree as ET
import csv

HEADERS = [
    'id_lembaga_vokasi',
    'institutionId',
    'nama',
    'email',
    'propinsi',
    'kota',
    'nomor_hp',
    'Jenis lembaga',
    'ownership',
    'jenis',
    'kapasitas',
    'legalityStatus',
    'facilityStatus',
    'programStatus',
    'sektor',
    'jabatan',
]

def convert(xlsx_path, out_csv_path):
    if not os.path.exists(xlsx_path):
        print(f"Error: File tidak ditemukan: {xlsx_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Membuka file Excel: {xlsx_path}...")
    with zipfile.ZipFile(xlsx_path) as z:
        # 1. Read shared strings
        sst = []
        if 'xl/sharedStrings.xml' in z.namelist():
            print("Membaca data string teks...")
            sst_root = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in sst_root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                text = ''.join(t.text for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t.text)
                sst.append(text)

        def read_sheet_rows(sheet_name_or_idx):
            sheet_file = f'xl/worksheets/sheet{sheet_name_or_idx}.xml'
            if sheet_file not in z.namelist():
                return []
            root = ET.fromstring(z.read(sheet_file))
            headers = {}
            rows = []
            for r_idx, row in enumerate(root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')):
                cells = {}
                for c in row.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    col_ref = ''.join(filter(str.isalpha, c.attrib.get('r', '')))
                    t = c.attrib.get('t')
                    v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    val = v.text if v is not None else ''
                    if t == 's' and val.isdigit() and int(val) < len(sst):
                        val = sst[int(val)]
                    cells[col_ref] = val.strip()
                if r_idx == 0:
                    headers = cells
                else:
                    rows.append({headers.get(k, k): val for k, val in cells.items()})
            return rows

        print("Membaca sheet Pendataan...")
        pendataan = read_sheet_rows(1)
        print(f"Ditemukan {len(pendataan)} data lembaga.")

        print("Membaca sheet Pendataan Relations...")
        relations = read_sheet_rows(2)
        print(f"Ditemukan {len(relations)} relasi kejuruan.")

    # Group relations by pendataanId
    rel_by_pid = {}
    for r in relations:
        pid = r.get('pendataanId')
        if pid:
            rel_by_pid.setdefault(pid, []).append(r)

    output_rows = []
    skipped = 0

    for p in pendataan:
        pid = p.get('id')
        name = p.get('namaLembaga')
        if not pid or not name:
            skipped += 1
            continue

        prov = p.get('provinsi') or 'Jawa Barat'
        kota = p.get('kabKota') or 'Kota'
        jenis_lembaga = p.get('jenisLembaga') or 'SMK'
        ownership = p.get('pemerintahNon') or 'Pemerintah'
        bentuk = p.get('bentukLembaga') or 'Pendidikan'
        email = p.get('email') or ''
        phone = p.get('nomorTelepon') or ''
        inst_id = p.get('dedupeKey') or pid

        rels = rel_by_pid.get(pid, [])
        if rels:
            for r in rels:
                sektor = r.get('sektor') or 'Umum'
                jabatan = r.get('jabatan') or 'Teknisi'
                kap = r.get('kapasitas') or ''
                legality = r.get('layer1Legalitas') or ''
                facility = r.get('layer2Fasilitas') or ''
                program = r.get('layer3Program') or ''

                output_rows.append([
                    pid,
                    inst_id,
                    name,
                    email,
                    prov,
                    kota,
                    phone,
                    jenis_lembaga,
                    ownership,
                    bentuk,
                    kap,
                    legality,
                    facility,
                    program,
                    sektor,
                    jabatan
                ])
        else:
            output_rows.append([
                pid,
                inst_id,
                name,
                email,
                prov,
                kota,
                phone,
                jenis_lembaga,
                ownership,
                bentuk,
                '100',
                'verified',
                'verified',
                'verified',
                'Umum',
                'Tenaga Terampil'
            ])

    os.makedirs(os.path.dirname(os.path.abspath(out_csv_path)), exist_ok=True)
    print(f"Menulis {len(output_rows)} baris ke {out_csv_path}...")
    with open(out_csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(HEADERS)
        writer.writerows(output_rows)

    print(f"Konversi selesai! Berhasil memetakan {len(output_rows)} data kejuruan dari {len(pendataan) - skipped} lembaga.")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Penggunaan: python convert_vokasi_spreadsheet.py <input.xlsx> <output.csv>")
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2])
