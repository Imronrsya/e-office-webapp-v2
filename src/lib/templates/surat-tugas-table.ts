/**
 * Interface untuk blok tanda tangan
 */
export interface SignatureBlock {
  signerRole: string;
  signerName: string;
  signerNip?: string;
  signatureUrl?: string;
  signedAt?: string;
  prefix?: string;         // Awalan seperti "Mengetahui,"
}

export interface MahasiswaData {
  nama: string;
  nim: string;
  prodi: string;
  [key: string]: string; // Support dynamic columns
}

/**
 * Interface untuk kolom custom
 */
export interface CustomColumn {
  key: string;
  label: string;
}

/**
 * Interface untuk penerima tembusan
 * userId kosong = tembusan text (tampil di surat)
 * userId terisi = tembusan user (hanya untuk akses sistem, tidak tampil di surat)
 */
export interface TembusanRecipient {
  userId?: string;        // Jika ada, tembusan ini hanya untuk akses sistem
  name: string;
  description?: string;
}

export interface SuratTugasTableData {
  nomorSurat: string;
  dataMahasiswa: MahasiswaData[];
  keterangan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  
  // Custom columns for table
  customColumns?: CustomColumn[];
  
  // Tanda tangan
  signatures?: SignatureBlock[];
  
  // Tanggal surat
  tanggalSurat?: string;
  
  // QR Code untuk verifikasi
  qrCodeDataUrl?: string;
  verificationUrl?: string;
  
  // Tembusan - daftar penerima salinan surat
  tembusan?: TembusanRecipient[];
}

/**
 * Helper untuk render blok tanda tangan
 */
const renderSignatureBlock = (signature: SignatureBlock): string => {
  const signatureImage = signature.signatureUrl 
    ? `<img src="${signature.signatureUrl}" alt="Tanda Tangan" style="max-width: 120px; max-height: 60px; object-fit: contain;" />`
    : '<div style="height: 60px;"></div>';
  
  return `
    <div class="signature-block" style="text-align: center; min-width: 200px;">
      ${signature.prefix ? `<p style="margin: 0 0 5px 0; color: #000000 !important; font-style: italic;">${signature.prefix}</p>` : ''}
      <p style="margin: 0 0 5px 0; color: #000000 !important;">${signature.signerRole}</p>
      ${signatureImage}
      <p style="margin: 5px 0 0 0; color: #000000 !important; font-weight: bold; text-decoration: underline;">${signature.signerName}</p>
      ${signature.signerNip ? `<p style="margin: 2px 0 0 0; color: #000000 !important; font-size: 10pt;">NIP. ${signature.signerNip}</p>` : ''}
    </div>
  `;
};

/**
 * Sort signatures by hierarchy: Wadek 2 (lowest), Wadek 1, Dekan (highest)
 */
const sortSignaturesByHierarchy = (signatures: SignatureBlock[]): SignatureBlock[] => {
  if (signatures.length !== 3) return signatures;
  
  const getHierarchyRank = (role: string): number => {
    const upperRole = role.toUpperCase();
    if (upperRole.includes('DEKAN') && !upperRole.includes('WAKIL')) return 3;
    if (upperRole.includes('WAKIL') && upperRole.includes('1')) return 2;
    if (upperRole.includes('WAKIL') && upperRole.includes('2')) return 1;
    if (upperRole.includes('WADEK') && upperRole.includes('1')) return 2;
    if (upperRole.includes('WADEK') && upperRole.includes('2')) return 1;
    return 0;
  };
  
  return [...signatures].sort((a, b) => getHierarchyRank(a.signerRole) - getHierarchyRank(b.signerRole));
};

/**
 * Helper untuk render semua blok tanda tangan dengan layout berdasarkan jumlah
 */
const renderSignatures = (signatures?: SignatureBlock[]): string => {
  if (!signatures || signatures.length === 0) {
    return `
      <div class="ttd-count-1">
        <div class="ttd-box">
          <p style="color: #ffffff;"></p>
          <p style="color: #ffffff;"></p>
          <p class="nama-pejabat" style="color: #ffffff;"></p>
          <p style="color: #ffffff;"></p>
        </div>
      </div>
    `;
  }
  
  const sortedSignatures = sortSignaturesByHierarchy(signatures);
  const count = sortedSignatures.length;
  const countClass = `ttd-count-${Math.min(count, 4)}`;
  
  const signatureBlocks = sortedSignatures.map(sig => renderSignatureBlock(sig)).join('');
  
  return `<div class="${countClass}">${signatureBlocks}</div>`;
};

/**
 * Helper untuk render QR Code
 */
const renderQRCode = (qrCodeDataUrl?: string): string => {
  if (!qrCodeDataUrl) return '';
  
  return `
    <div class="qr-code-container" style="position: fixed; bottom: 20px; right: 20px; text-align: center; background: white; padding: 5px;">
      <img src="${qrCodeDataUrl}" alt="QR Code Verifikasi" style="width: 80px; height: 80px;" />
      <p style="margin: 2px 0 0 0; font-size: 6pt; color: #666666 !important;">Scan untuk verifikasi</p>
    </div>
  `;
};

/**
 * Helper untuk render daftar tembusan di kiri bawah, di atas QR
 * Hanya menampilkan tembusan text (userId kosong)
 * Tembusan user (userId terisi) hanya untuk akses sistem, tidak ditampilkan di surat
 * Mendukung format lama (string[]) dan format baru (TembusanRecipient[])
 */
const renderTembusan = (tembusan?: (TembusanRecipient | string)[]): string => {
  if (!tembusan || tembusan.length === 0) return '';
  
  // Normalize: convert to TembusanRecipient format
  const normalizedTembusan: TembusanRecipient[] = tembusan.map(t => {
    if (typeof t === 'string') {
      // Old format: string - convert to object
      return { userId: '', name: t, description: '' };
    }
    return t;
  });
  
  // Filter: hanya tampilkan tembusan yang userId-nya kosong (text-based)
  // Tembusan dengan userId = untuk akses sistem saja, tidak ditampilkan di surat
  const textBasedTembusan = normalizedTembusan.filter(t => !t.userId || t.userId === '');
  
  if (textBasedTembusan.length === 0) return '';
  
  const recipients = textBasedTembusan.map((t, idx) => {
    const desc = t.description ? ` (${t.description})` : '';
    return `<li style="color: #000000 !important; margin-bottom: 2px;">${t.name}${desc}</li>`;
  }).join('\n');
  
  const itemCount = textBasedTembusan.length;
  const baseBottom = 110;
  const additionalHeight = Math.max(0, (itemCount - 2) * 18);
  const bottomPosition = baseBottom + additionalHeight;
  
  return `
    <div class="tembusan-container" style="position: fixed; bottom: ${bottomPosition}px; left: 60px; max-width: 280px; z-index: 100; background: white;">
      <p style="margin: 0 0 5px 0; color: #000000 !important; font-weight: bold;">Tembusan:</p>
      <ol style="margin: 0; padding-left: 20px; color: #000000 !important; line-height: 1.4;">
        ${recipients}
      </ol>
    </div>
  `;
};

/**
 * Helper untuk render tabel mahasiswa dengan kolom custom
 */
const renderMahasiswaTable = (dataMahasiswa: MahasiswaData[], customColumns?: CustomColumn[]): string => {
  const cols = customColumns || [];
  
  // Generate header
  const headerCells = [
    '<th style="color: #000000;">No</th>',
    '<th style="color: #000000;">Nama</th>',
    '<th style="color: #000000;">NIM</th>',
    '<th style="color: #000000;">PRODI</th>',
    ...cols.map(col => `<th style="color: #000000;">${col.label || col.key}</th>`)
  ].join('\n          ');
  
  // Generate body rows
  const bodyRows = (dataMahasiswa || []).map((mhs, index) => {
    const baseCells = [
      `<td style="color: #000000;">${index + 1}.</td>`,
      `<td style="color: #000000;">${mhs.nama}</td>`,
      `<td style="color: #000000;">${mhs.nim}</td>`,
      `<td style="color: #000000;">${mhs.prodi}</td>`,
    ];
    const customCells = cols.map(col => `<td style="color: #000000;">${mhs[col.key] || ''}</td>`);
    return `<tr>\n          ${[...baseCells, ...customCells].join('\n          ')}\n        </tr>`;
  }).join('\n        ');
  
  return `
    <table class="table-mahasiswa">
      <thead>
        <tr>
          ${headerCells}
        </tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  `;
};

export const suratTugasTableTemplate = (data: SuratTugasTableData): string => `<!DOCTYPE html>>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surat Tugas - FSM UNDIP</title>
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
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      margin: 0;
      padding: 40px 60px;
      max-width: 21cm;
      color: #000000 !important;
      background: #ffffff !important;
    }
    .header-container {
      display: flex;
      align-items: flex-start;
      border-bottom: 3px solid #ffffff !important;
      padding-bottom: 10px;
      margin-bottom: 5px;
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
      color: #3e4ba8 !important;
    }
    .kop-surat h2 {
      margin: 2px 0;
      font-size: 13pt;
      color: #3e4ba8 !important;
      font-weight: bold;
      line-height: 1.2;
    }
    .alamat-kontak {
      width: 35%;
      text-align: right;
      font-size: 6.5pt;
      color: #3e4ba8 !important;
    }
    .alamat-kontak p {
      color: #3e4ba8 !important;
      line-height: 1.4;
    }
    .judul-surat {
      text-align: center;
      margin-top: 20px;
      margin-bottom: 15px;
    }
    .judul-surat h4 {
      margin: 0;
      text-decoration: underline;
      font-size: 12pt;
      font-weight: bold;
    }
    .judul-surat p {
      margin: 5px 0 0 0;
      font-size: 11pt;
    }
    .isi-surat {
      text-align: justify;
      margin: 15px 0;
      line-height: 1.5;
    }
    .table-mahasiswa {
      margin: 15px 0;
      width: 100%;
      border-collapse: collapse;
    }
    .table-mahasiswa th {
      border: 1px solid #000000;
      padding: 8px;
      text-align: center;
      background-color: #d3d3d3;
      font-weight: bold;
    }
    .table-mahasiswa td {
      border: 1px solid #000000;
      padding: 8px;
    }
    .table-mahasiswa td:first-child {
      text-align: center;
      width: 5%;
    }
    .table-mahasiswa td:nth-child(2) {
      width: 35%;
    }
    .table-mahasiswa td:nth-child(3) {
      text-align: center;
      width: 20%;
    }
    .table-mahasiswa td:nth-child(4) {
      width: 40%;
    }
    .penutup {
      margin: 15px 0;
      text-align: justify;
    }
    .ttd-container {
      margin-top: 30px;
      page-break-inside: avoid;
      clear: both;
    }
    
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

    .ttd-count-3 .signature-block:nth-child(1) {
      grid-area: t1;
      justify-self: start;
    }

    .ttd-count-3 .signature-block:nth-child(2) {
      grid-area: t2;
      justify-self: end;
    }

    .ttd-count-3 .signature-block:nth-child(3) {
      grid-area: t3;
      justify-self: center;
    }

    /* 4 TTD → grid 2x2 */
    .ttd-count-4 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .ttd-box {
      text-align: center;
      min-width: 200px;
    }
    .signature-block {
      text-align: center;
      min-width: 200px;
    }
    .ttd-box p {
      margin: 3px 0;
      color: #000000 !important;
    }
    .nama-pejabat {
      margin-top: 70px !important;
      font-weight: normal;
      color: #000000 !important;
      text-decoration: underline;
    }
    .qr-code-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      text-align: center;
      background: white;
      padding: 5px;
      z-index: 1000;
    }
    .tembusan-container {
      margin-top: 40px;
      max-width: 300px;
      font-size: 11pt;
      line-height: 1.4;
    }
    @media print {
      .qr-code-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
      }
    }
    b, strong {
      font-weight: bold !important;
      color: #000000 !important;
    }
    p, td, th, div, span, h1, h2, h3, h4, h5, h6 {
      color: #000000 !important;
    }
    table {
      color: #000000 !important;
    }
  </style>
</head>
<body style="color: #000000;">
  <div class="header-container" style="border-bottom: 3px solid #000000;">
    <div class="logo-container">
      <img src="https://mm.feb.undip.ac.id/wp-content/uploads/2021/11/universitas-diponegoro-logo.png" alt="Logo UNDIP" class="logo">
    </div>
    <div class="kop-surat">
      <h3 style="color: #000000;">KEMENTERIAN PENDIDIKAN TINGGI, SAINS,<br>DAN TEKNOLOGI</h3>
      <h2 style="color: #3e4ba8;">UNIVERSITAS DIPONEGORO</h2>
      <h2 style="color: #3e4ba8;">FAKULTAS SAINS DAN MATEMATIKA</h2>
    </div>
    <div class="alamat-kontak">
      <p style="color: #000000;">Jalan Prof. Sudarto, S.H Tembalang Semarang<br>
         Kode Pos 50275<br>
         Telp (024) 7474754 Fax (024) 76480690<br>
         Laman https://fsm.undip.ac.id<br>
         e-mail fsm@undip.ac.id</p>
    </div>
  </div>
  
  <div class="judul-surat">
    <h4 style="color: #000000;">SURAT TUGAS</h4>
    <p style="color: #000000;">Nomor : ${data.nomorSurat}</p>
  </div>
  
  <div class="isi-surat">
    <p style="color: #000000;">
      Dekan Fakultas Sains dan Matematika Universitas Diponegoro menugaskan kepada mahasiswa Fakultas Sains dan Matematika Universitas Diponegoro sebagai berikut :
    </p>
    
    ${renderMahasiswaTable(data.dataMahasiswa, data.customColumns)}
    
    <p style="color: #000000;">
      Sebagai <b style="color: #000000;">${data.keterangan}</b> mulai tanggal ${data.tanggalMulai} s.d ${data.tanggalSelesai}.
    </p>
  </div>
  
  <div class="penutup">
    <p style="color: #000000;">Demikian untuk dilaksanakan dengan sebaik-baiknya dan memberikan laporan setelah selesai.</p>
  </div>
  ${data.tanggalSurat ? `<p style="text-align: right; margin-top: 30px; color: #000000 !important;">${data.tanggalSurat}</p>` : ''}
  <div class="ttd-container">
    ${renderSignatures(data.signatures)}
  </div>
  ${renderTembusan(data.tembusan)}
  ${renderQRCode(data.qrCodeDataUrl)}
</body>
</html>`;
