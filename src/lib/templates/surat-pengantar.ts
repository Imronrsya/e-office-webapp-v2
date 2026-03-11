// Template Surat Pengantar - Adapted from kesekiankali project
// Template ini digunakan untuk generate surat pengantar mahasiswa

/**
 * Interface untuk penerima tembusan
 */
export interface TembusanRecipient {
    name: string;
    description?: string;
}

/**
 * Interface untuk blok tanda tangan (shared with other templates)
 */
export interface SignatureBlock {
    signerRole: string;
    signerName: string;
    signerNip?: string;
    signatureUrl?: string;
    signedAt?: string;
    prefix?: string;
}

export interface SuratPengantarData {
    nomorSurat: string;
    tanggalSurat: string;
    perihal: string;
    namaTujuan: string;
    jabatanTujuan: string;
    alamatTujuan: string;
    keperluan: string; // Jenis kegiatan (magang, penelitian, dll)
    namaMahasiswa: string;
    nimMahasiswa: string;
    programStudi: string;
    departemen: string;
    judulAcara: string;
    tanggalMulai: string;
    lokasiAcara: string;
    durasiAcara?: string;
    isPengajuMahasiswa?: boolean; // Flag untuk menentukan apakah pengaju mahasiswa (true) atau dosen (false)
    // TTD Kaprodi
    namaKaprodi?: string;
    nipKaprodi?: string;
    signatureKaprodi?: string;
    prefixKaprodi?: string; // Awalan seperti "Mengetahui,"
    // TTD Kadep
    namaKadep?: string;
    nipKadep?: string;
    signatureKadep?: string;
    prefixKadep?: string; // Awalan seperti "Mengetahui,"
    // Tembusan - mendukung string (legacy) atau TembusanRecipient[] (baru)
    tembusan?: string | TembusanRecipient[];
    // Watermark DRAFT - jika true selalu tampilkan, jika undefined gunakan logika otomatis
    showDraftWatermark?: boolean;
    // Flexible signatures (baru) - jika ada, gunakan ini dan abaikan namaKaprodi/namaKadep
    signatures?: SignatureBlock[];
}

/**
 * Helper untuk render daftar tembusan
 * NOTE: Tembusan di surat pengantar di-hidden sesuai permintaan user
 */
const renderTembusan = (tembusan?: string | TembusanRecipient[]): string => {
    // Tembusan hidden untuk surat pengantar
    return '';
};

export function generateSuratPengantarHTML(data: SuratPengantarData): string {
    const {
        nomorSurat = "-",
        tanggalSurat,
        perihal,
        namaTujuan,
        jabatanTujuan,
        alamatTujuan,
        keperluan,
        namaMahasiswa,
        nimMahasiswa,
        programStudi,
        departemen,
        judulAcara,
        tanggalMulai,
        lokasiAcara,
        durasiAcara,
        isPengajuMahasiswa = true, // Default ke mahasiswa jika tidak ditentukan
        namaKaprodi,
        nipKaprodi,
        signatureKaprodi,
        prefixKaprodi,
        namaKadep,
        nipKadep,
        signatureKadep,
        prefixKadep,
        tembusan,
        showDraftWatermark,
    } = data;

    // Helper untuk display label role
    const getRoleDisplayLabel = (role: string): string => {
        const ROLE_LABELS: Record<string, string> = {
            'DEKAN': 'Dekan',
            'WADEK_1': 'Wakil Dekan I',
            'WADEK_2': 'Wakil Dekan II',
            'KADEP': 'Ketua Departemen',
            'KAPRODI': 'Ketua Program Studi',
        };
        return ROLE_LABELS[role] || role;
    };

    // Determine if using new flexible signatures or legacy fields
    const useFlexibleSignatures = !!(data.signatures && data.signatures.length > 0);

    // Legacy: Determine signature layout based on which signers are present
    const hasKaprodi = !!namaKaprodi;
    const hasKadep = !!namaKadep;
    const tingkatTTD = hasKaprodi && hasKadep ? "dua" : hasKaprodi ? "kaprodi" : hasKadep ? "kadep" : "";

    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Surat Pengantar - FSM UNDIP</title>
    <style>
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                background: #ffffff !important;
            }
            #surat-content {
                padding: 0 !important;
                box-shadow: none !important;
            }
        }
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
        }
        @page {
            size: A4;
            margin: 15mm 20mm 25mm 20mm;
        }
        html {
            margin: 0; padding: 0;
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1;
            margin: 0 auto;
            padding: 0;
            width: 210mm;
            color: #000000;
            background: #ffffff;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        #surat-content {
            width: 210mm;
            margin: 0 auto;
            padding: 10mm 20mm 20mm 20mm;
            background: #ffffff;
        }
        .header-container {
            display: flex;
            align-items: flex-start;
            padding-bottom: 10px;
            margin-bottom: 5px;
        }
        .header-divider {
            margin-bottom: 20px;
        }
        .logo-container {
            width: 12%;
            text-align: left;
        }
        .logo {
            width: 75px;
            height: auto;
        }
        .kop-surat {
            width: 53%;
            text-align: left;
            padding-left: 15px;
        }
        .kop-surat h3 {
            margin: 0;
            font-size: 10pt;
            font-weight: normal;
            letter-spacing: 0.3px;
            line-height: 1.3;
            color: #3e4ba8;
        }
        .kop-surat h2 {
            margin: 2px 0;
            font-size: 13pt;
            color: #3e4ba8;
            font-weight: bold;
            line-height: 1.2;
        }
        .alamat-kontak {
            width: 35%;
            text-align: right;
            font-size: 6.5pt;
            color: #3e4ba8;
        }
        .alamat-kontak p {
            color: #3e4ba8;
            line-height: 1.4;
            margin: 0;
        }
        .info-surat {
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .info-surat table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-surat td {
            padding: 2px 0;
            vertical-align: top;
            color: #000000;
        }
        .info-surat .label {
            width: 80px;
            font-weight: normal;
        }
        .info-surat .colon {
            width: 20px;
        }
        .alamat-tujuan {
            margin: 20px 0;
            line-height: 1.2;
        }
        .isi-surat {
            text-align: justify;
            margin: 25px 0;
            line-height: 1.2;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
        }
        .data-table {
            margin: 20px 0 20px 50px;
            width: calc(100% - 50px);
        }
        .data-table td {
            padding: 3px 0;
            vertical-align: top;
            color: #000000;
        }
        .data-table .label-col {
            width: 150px;
        }
        .data-table .colon-col {
            width: 20px;
        }
        .penutup {
            margin: 25px 0;
            text-align: justify;
        }
        .ttd-container {
            margin-top: 60px;
            display: flex;
            width: 100%;
            clear: both;
            page-break-inside: avoid;
        }
        
        /* JIKA DUA TTD: kya 2iri & kanan */
        .ttd-container.dua {
            justify-content: space-between;
        }
        
        /* JIKA HANYA SATU TTD: di kanan bawah */
        .ttd-container.kaprodi,
        .ttd-container.kadep {
            justify-content: flex-end;
        }

        /* Flexible layout: ttd-count-* classes (sama dengan template lain) */
        /* 1 TTD → kanan */
        .ttd-count-1 {
            display: flex;
            justify-content: flex-end;
        }

        /* 2 TTD → kiri & kanan */
        .ttd-count-2 {
            display: flex;
            justify-content: space-between;
        }

        /* 3 TTD: 2 di atas (kiri-kanan), 1 di bawah tengah */
        .ttd-count-3 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-areas:
                "t1 t2"
                "t3 t3";
            gap: 30px;
        }

        .ttd-count-3 .ttd-box:nth-child(1) {
            grid-area: t1;
            justify-self: start;
        }

        .ttd-count-3 .ttd-box:nth-child(2) {
            grid-area: t2;
            justify-self: end;
        }

        .ttd-count-3 .ttd-box:nth-child(3) {
            grid-area: t3;
            justify-self: center;
        }
        
        .ttd-box {
            width: 45%;
            text-align: center;
            page-break-inside: avoid;
        }
        .ttd-box p {
            margin: 3px 0;
            color: #000000;
        }
        .jabatan-ttd {
            margin-top: 5px;
            font-weight: normal;
        }
        .signature-area {
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: 20px;
        }
        .signature-img {
            max-height: 60px;
            max-width: 120px;
        }
        .nama-pejabat {
            font-weight: bold;
            color: #000000;
            text-decoration: underline;
        }
        .nip-pejabat {
            font-size: 11pt;
        }
        .tembusan {
            display: none; /* Tembusan disembunyikan di surat pengantar */
            margin-top: 40px;
            line-height: 1.6;
            max-width: 300px;
            text-align: left;
            clear: both;
        }
        /* DRAFT Watermark - background repeating di seluruh konten (semua halaman) */
        #surat-content.has-draft-watermark {
            background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Ctext x='300' y='200' dominant-baseline='middle' text-anchor='middle' transform='rotate(-45,300,200)' font-size='80' font-family='Times New Roman' font-weight='bold' fill='rgba(0,0,0,0.07)'%3EDRAFT%3C/text%3E%3C/svg%3E");
            background-repeat: repeat;
            background-position: center top;
            background-size: 600px 400px;
        }
        b, strong {
            font-weight: bold;
            color: #000000;
        }
    </style>
</head>
<body>
    
    <div id="surat-content" class="${(showDraftWatermark !== undefined ? showDraftWatermark : (
            // Auto-detect: DRAFT muncul selama ada penandatangan yang belum tanda tangan
            // Hanya cek penandatangan yang memang ada (punya nama)
            (hasKaprodi && !signatureKaprodi) || (hasKadep && !signatureKadep) || (!hasKaprodi && !hasKadep)
        )) ? 'has-draft-watermark' : ''}">
        <div class="header-container">
            <div class="logo-container">
                <img src="/Undip-Logo.png" alt="Logo UNDIP" class="logo">
            </div>
            <div class="kop-surat">
                <h3>KEMENTERIAN PENDIDIKAN TINGGI, SAINS,<br>DAN TEKNOLOGI</h3>
                <h2 style="color: #3e4ba8;">UNIVERSITAS DIPONEGORO</h2>
                <h2 style="color: #3e4ba8;">FAKULTAS SAINS DAN MATEMATIKA</h2>
                ${departemen ? `<h2 style="color: #3e4ba8; text-transform: uppercase; font-weight: bold;">${departemen.toUpperCase().startsWith('DEPARTEMEN') ? departemen.toUpperCase() : `DEPARTEMEN ${departemen.toUpperCase()}`}</h2>` : ''}
            </div>
            <div class="alamat-kontak">
                <p>Jalan Prof. Sudarto, S.H Tembalang Semarang<br>
                    Kode Pos 50275<br>
                    Telp (024) 7474754 Fax (024) 76480690<br>
                    Laman https://fsm.undip.ac.id<br>
                    e-mail fsm@undip.ac.id</p>
            </div>
        </div>
        
        <div class="info-surat">
            <table>
                <tr>
                    <td class="label">Nomor</td>
                    <td class="colon">:</td>
                    <td>${nomorSurat}</td>
                    <td rowspan="3" style="text-align: right;"><i>${tanggalSurat}</i></td>
                </tr>
                <tr>
                    <td class="label">Lampiran</td>
                    <td class="colon">:</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td class="label">Hal</td>
                    <td class="colon">:</td>
                    <td>${perihal}</td>
                </tr>
            </table>
        </div>
        
        <div class="alamat-tujuan">
            <p style="margin: 0;">
                <b>Yth. ${namaTujuan || '[Nama Penerima]'}</b><br>
                <b>${jabatanTujuan || '[Jabatan]'}</b><br>
                ${alamatTujuan || '[Alamat]'}
            </p>
        </div>
        
        <div class="isi-surat">
            <p>
                Sehubungan dengan kegiatan ${keperluan} ${isPengajuMahasiswa ? 'mahasiswa' : 'dosen'} Program Studi ${programStudi} 
                Departemen ${departemen} Fakultas Sains dan Matematika Universitas Diponegoro 
                tersebut di bawah ini:
            </p>
            
            <table class="data-table">
                <tr>
                    <td class="label-col">Nama</td>
                    <td class="colon-col">:</td>
                    <td>${namaMahasiswa}</td>
                </tr>
                <tr>
                    <td class="label-col">${isPengajuMahasiswa ? 'NIM' : 'NIP'}</td>
                    <td class="colon-col">:</td>
                    <td>${nimMahasiswa}</td>
                </tr>
                <tr>
                    <td class="label-col">Judul Kegiatan</td>
                    <td class="colon-col">:</td>
                    <td>${judulAcara}</td>
                </tr>
                <tr>
                    <td class="label-col">Lokasi</td>
                    <td class="colon-col">:</td>
                    <td>${lokasiAcara}</td>
                </tr>
                ${durasiAcara ? `
                <tr>
                    <td class="label-col">Durasi</td>
                    <td class="colon-col">:</td>
                    <td>${durasiAcara}</td>
                </tr>
                ` : ''}
            </table>
            
            <p>
                dengan ini mohon kiranya dapat diizinkan bagi mahasiswa tersebut untuk 
                melaksanakan kegiatan ${(keperluan || 'kegiatan').toLowerCase()} di tempat Saudara yang akan 
                dilaksanakan mulai tanggal ${tanggalMulai}.
            </p>
            
            <p>
                Segala persyaratan dan konsekuensi yang ada menjadi tanggung jawab 
                mahasiswa yang bersangkutan.
            </p>
        </div>
        
        <div class="penutup">
            <p>Atas perhatian dan kerjasama Saudara kami ucapkan terima kasih.</p>
        </div>
        
        <!-- TTD Container - Dynamic based on signers -->
        ${useFlexibleSignatures ? `
        <!-- Flexible signatures mode -->
        <div class="ttd-container ttd-count-${Math.min(data.signatures!.length, 3)}">
            ${data.signatures!.map(sig => `
            <div class="ttd-box">
                ${sig.prefix ? `<p class="prefix-ttd" style="margin-bottom: 5px;">${sig.prefix}</p>` : ''}
                <p class="jabatan-ttd">${getRoleDisplayLabel(sig.signerRole)}</p>
                <div class="signature-area">
                    ${sig.signatureUrl ? `<img src="${sig.signatureUrl}" alt="TTD" class="signature-img" />` : ''}
                </div>
                <p class="nama-pejabat">${sig.signerName || '...'}</p>
                <p class="nip-pejabat">${sig.signerNip ? `NIP. ${sig.signerNip}` : ''}</p>
            </div>
            `).join('')}
        </div>
        ` : `
        <!-- Legacy mode: hardcoded Kaprodi/Kadep -->
        <div class="ttd-container ${tingkatTTD}">
        
            ${tingkatTTD === "dua" ? `
            <div class="ttd-box kaprodi">
                ${prefixKaprodi ? `<p class="prefix-ttd" style="margin-bottom: 5px;">${prefixKaprodi}</p>` : ''}
                <p class="jabatan-ttd">Ketua Program Studi</p>
                <div class="signature-area">
                    ${signatureKaprodi ? `<img src="${signatureKaprodi}" alt="TTD Kaprodi" class="signature-img" />` : ''}
                </div>
                <p class="nama-pejabat">${namaKaprodi || '...'}</p>
                <p class="nip-pejabat">${nipKaprodi ? `NIP. ${nipKaprodi}` : ''}</p>
            </div>
            <div class="ttd-box kadep">
                ${prefixKadep ? `<p class="prefix-ttd" style="margin-bottom: 5px;">${prefixKadep}</p>` : ''}
                <p class="jabatan-ttd">Ketua Departemen</p>
                <div class="signature-area">
                    ${signatureKadep ? `<img src="${signatureKadep}" alt="TTD Kadep" class="signature-img" />` : ''}
                </div>
                <p class="nama-pejabat">${namaKadep || '...'}</p>
                <p class="nip-pejabat">${nipKadep ? `NIP. ${nipKadep}` : ''}</p>
            </div>
            ` : ''}
        
            ${tingkatTTD === "kaprodi" ? `
            <div class="ttd-box kaprodi">
                ${prefixKaprodi ? `<p class="prefix-ttd" style="margin-bottom: 5px;">${prefixKaprodi}</p>` : ''}
                <p class="jabatan-ttd">Ketua Program Studi</p>
                <div class="signature-area">
                    ${signatureKaprodi ? `<img src="${signatureKaprodi}" alt="TTD Kaprodi" class="signature-img" />` : ''}
                </div>
                <p class="nama-pejabat">${namaKaprodi || '...'}</p>
                <p class="nip-pejabat">${nipKaprodi ? `NIP. ${nipKaprodi}` : ''}</p>
            </div>
            ` : ''}
        
            ${tingkatTTD === "kadep" ? `
            <div class="ttd-box kadep">
                ${prefixKadep ? `<p class="prefix-ttd" style="margin-bottom: 5px;">${prefixKadep}</p>` : ''}
                <p class="jabatan-ttd">Ketua Departemen</p>
                <div class="signature-area">
                    ${signatureKadep ? `<img src="${signatureKadep}" alt="TTD Kadep" class="signature-img" />` : ''}
                </div>
                <p class="nama-pejabat">${namaKadep || '...'}</p>
                <p class="nip-pejabat">${nipKadep ? `NIP. ${nipKadep}` : ''}</p>
            </div>
            ` : ''}
        
        </div>
        `}
        
        ${renderTembusan(tembusan)}
    </div>
</body>
</html>
`;
}

// Helper function to format date in Indonesian
export function formatTanggalIndonesia(date: Date | string | null | undefined): string {
    if (!date) {
        return '-';
    }
    const d = typeof date === 'string' ? new Date(date) : date;
    // Check if date is valid
    if (isNaN(d.getTime())) {
        return '-';
    }
    const bulan = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

