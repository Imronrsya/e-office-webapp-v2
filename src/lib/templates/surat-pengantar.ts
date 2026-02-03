// Template Surat Pengantar - Adapted from kesekiankali project
// Template ini digunakan untuk generate surat pengantar mahasiswa

/**
 * Interface untuk penerima tembusan
 */
export interface TembusanRecipient {
    name: string;
    description?: string;
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
        namaKaprodi,
        nipKaprodi,
        signatureKaprodi,
        prefixKaprodi,
        namaKadep,
        nipKadep,
        signatureKadep,
        prefixKadep,
        tembusan,
    } = data;

    // Determine signature layout based on which signers are present (check names, not signatures)
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
            }
        }
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
        }
        @page {
            size: A4;
            margin: 0;
        }
        html, body {
            width: 21cm;
            min-height: 29.7cm;
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            margin: 0;
            padding: 50px 60px 80px 60px;
            max-width: 21cm;
            color: #000000;
            background: #ffffff;
            box-sizing: border-box;
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
            line-height: 1.6;
        }
        .isi-surat {
            text-align: justify;
            margin: 25px 0;
            line-height: 1.8;
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
        }
        
        /* JIKA DUA TTD: Kaprodi di kiri, Kadep di kanan */
        .ttd-container.dua {
            justify-content: space-between;
        }
        
        /* JIKA HANYA SATU TTD: di kanan bawah */
        .ttd-container.kaprodi,
        .ttd-container.kadep {
            justify-content: flex-end;
        }
        
        .ttd-box {
            width: 45%;
            text-align: center;
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
        .draft-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: rgba(0, 0, 0, 0.05);
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
        }
        b, strong {
            font-weight: bold;
            color: #000000;
        }
    </style>
</head>
<body>
    ${!signatureKaprodi && !signatureKadep ? '<div class="draft-watermark">DRAFT</div>' : ''}
    
    <div class="header-container">
        <div class="logo-container">
            <img src="https://mm.feb.undip.ac.id/wp-content/uploads/2021/11/universitas-diponegoro-logo.png" alt="Logo UNDIP" class="logo">
        </div>
        <div class="kop-surat">
            <h3>KEMENTERIAN PENDIDIKAN TINGGI, SAINS,<br>DAN TEKNOLOGI</h3>
            <h2 style="color: #3e4ba8;">UNIVERSITAS DIPONEGORO</h2>
            <h2 style="color: #3e4ba8;">FAKULTAS SAINS DAN MATEMATIKA</h2>
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
            Sehubungan dengan kegiatan ${keperluan} mahasiswa Program Studi ${programStudi} 
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
                <td class="label-col">NIM</td>
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
    <div class="ttd-container ${tingkatTTD}">
    
        ${tingkatTTD === "dua" ? `
        <!-- Dua TTD: Kaprodi di kiri, Kadep di kanan -->
        <div class="ttd-box kaprodi">
            ${prefixKaprodi ? `<p class="prefix-ttd" style="font-style: italic; margin-bottom: 5px;">${prefixKaprodi}</p>` : ''}
            <p class="jabatan-ttd">Ketua Program Studi</p>
            <div class="signature-area">
                ${signatureKaprodi ? `<img src="${signatureKaprodi}" alt="TTD Kaprodi" class="signature-img" />` : ''}
            </div>
            <p class="nama-pejabat">${namaKaprodi || '...'}</p>
            <p class="nip-pejabat">${nipKaprodi ? `NIP. ${nipKaprodi}` : ''}</p>
        </div>
        <div class="ttd-box kadep">
            ${prefixKadep ? `<p class="prefix-ttd" style="font-style: italic; margin-bottom: 5px;">${prefixKadep}</p>` : ''}
            <p class="jabatan-ttd">Ketua Departemen</p>
            <div class="signature-area">
                ${signatureKadep ? `<img src="${signatureKadep}" alt="TTD Kadep" class="signature-img" />` : ''}
            </div>
            <p class="nama-pejabat">${namaKadep || '...'}</p>
            <p class="nip-pejabat">${nipKadep ? `NIP. ${nipKadep}` : ''}</p>
        </div>
        ` : ''}
    
        ${tingkatTTD === "kaprodi" ? `
        <!-- Hanya Kaprodi: di kanan -->
        <div class="ttd-box kaprodi">
            ${prefixKaprodi ? `<p class="prefix-ttd" style="font-style: italic; margin-bottom: 5px;">${prefixKaprodi}</p>` : ''}
            <p class="jabatan-ttd">Ketua Program Studi</p>
            <div class="signature-area">
                ${signatureKaprodi ? `<img src="${signatureKaprodi}" alt="TTD Kaprodi" class="signature-img" />` : ''}
            </div>
            <p class="nama-pejabat">${namaKaprodi || '...'}</p>
            <p class="nip-pejabat">${nipKaprodi ? `NIP. ${nipKaprodi}` : ''}</p>
        </div>
        ` : ''}
    
        ${tingkatTTD === "kadep" ? `
        <!-- Hanya Kadep: di kanan -->
        <div class="ttd-box kadep">
            ${prefixKadep ? `<p class="prefix-ttd" style="font-style: italic; margin-bottom: 5px;">${prefixKadep}</p>` : ''}
            <p class="jabatan-ttd">Ketua Departemen</p>
            <div class="signature-area">
                ${signatureKadep ? `<img src="${signatureKadep}" alt="TTD Kadep" class="signature-img" />` : ''}
            </div>
            <p class="nama-pejabat">${namaKadep || '...'}</p>
            <p class="nip-pejabat">${nipKadep ? `NIP. ${nipKadep}` : ''}</p>
        </div>
        ` : ''}
    
    </div>
    
    ${renderTembusan(tembusan)}
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

