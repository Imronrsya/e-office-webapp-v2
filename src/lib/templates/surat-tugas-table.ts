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

  // Stempel URL
  stempelUrl?: string;

  // Tanggal surat
  tanggalSurat?: string;

  // QR Code untuk verifikasi
  qrCodeDataUrl?: string;
  verificationUrl?: string;

  // Tembusan - daftar penerima salinan surat
  tembusan?: TembusanRecipient[];
}

/**
 * Get hierarchy rank for signature role
 */
const getHierarchyRank = (role: string): number => {
  const upperRole = role.toUpperCase();
  if (upperRole.includes('DEKAN') && !upperRole.includes('WAKIL')) return 3;
  if (upperRole.includes('WAKIL') && upperRole.includes('1')) return 2;
  if (upperRole.includes('WAKIL') && upperRole.includes('2')) return 1;
  if (upperRole.includes('WADEK') && upperRole.includes('1')) return 2;
  if (upperRole.includes('WADEK') && upperRole.includes('2')) return 1;
  return 0;
};

/**
 * Find the role that should receive the stempel overlay
 */
const findStempelRecipientRole = (signatures: SignatureBlock[]): string | null => {
  if (!signatures || signatures.length === 0) return null;

  let highestRank = 0;
  let stempelRecipientRole: string | null = null;

  for (const sig of signatures) {
    const rank = getHierarchyRank(sig.signerRole);
    if (rank > highestRank) {
      highestRank = rank;
      stempelRecipientRole = sig.signerRole;
    }
  }

  return stempelRecipientRole;
};

/**
 * Convert internal role code to display label
 */
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

/**
 * Helper untuk render blok tanda tangan dengan dukungan stempel
 */
const renderSignatureBlock = (signature: SignatureBlock, stempelUrl?: string, shouldHaveStempel = false): string => {
  const signatureImage = signature.signatureUrl
    ? `<img src="${signature.signatureUrl}" alt="Tanda Tangan" style="max-width: 120px; max-height: 60px; object-fit: contain;" crossorigin="anonymous" />`
    : '<div style="height: 60px;"></div>';

  // Stempel overlay untuk jabatan tertinggi
  // Posisi: di kiri tanda tangan, sedikit overlap
  const stempelOverlay = shouldHaveStempel && stempelUrl ? `
    <div style="position: absolute; top: 0; left: -30px; width: 100px; height: 100px; opacity: 0.9; z-index: 10; pointer-events: none;">
      <img src="${stempelUrl}" alt="Stempel" style="width: 100%; height: 100%; object-fit: contain;" crossorigin="anonymous" />
    </div>
  ` : '';

  return `
    <div class="signature-block" style="text-align: center; min-width: 200px; position: relative;">
      ${signature.prefix ? `<p style="margin: 0 0 5px 0; color: #000000 !important; font-style: italic;">${signature.prefix}</p>` : ''}
      <p style="margin: 0 0 5px 0; color: #000000 !important;">${getRoleDisplayLabel(signature.signerRole)}</p>
      <div style="position: relative; display: inline-block;">
        ${stempelOverlay}
        ${signatureImage}
      </div>
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
  return [...signatures].sort((a, b) => getHierarchyRank(a.signerRole) - getHierarchyRank(b.signerRole));
};

/**
 * Helper untuk render semua blok tanda tangan dengan layout berdasarkan jumlah
 */
const renderSignatures = (signatures?: SignatureBlock[], stempelUrl?: string): string => {
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

  // Find which signature should receive the stempel (highest ranking)
  const stempelRecipientRole = findStempelRecipientRole(signatures);

  const count = sortedSignatures.length;
  const countClass = `ttd-count-${Math.min(count, 4)}`;

  const signatureBlocks = sortedSignatures.map(sig => {
    const shouldHaveStempel = sig.signerRole === stempelRecipientRole;
    return renderSignatureBlock(sig, stempelUrl, shouldHaveStempel);
  }).join('');

  return `<div class="${countClass}">${signatureBlocks}</div>`;
};

/**
 * Helper untuk render QR Code sebagai running footer - muncul di setiap halaman
 */
const renderQRRunningFooter = (qrCodeDataUrl?: string): string => {
  if (qrCodeDataUrl) {
    return `
      <div class="qr-running">
        <img src="${qrCodeDataUrl}" alt="QR Code Verifikasi" crossorigin="anonymous" />
        <p class="qr-label">Scan untuk verifikasi</p>
      </div>
    `;
  }

  // Placeholder when QR code not yet generated
  return '';
};

/**
 * Helper untuk render QR Code (backward compat - returns empty)
 */
const renderQRCode = (qrCodeDataUrl?: string): string => {
  // QR Code sekarang di-render sebagai running footer
  return '';
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
    return `<li style="color: #000000 !important; margin-bottom: 2px;">${idx + 1}. ${t.name}${desc}</li>`;
  }).join('\n');

  // Tembusan sekarang menggunakan static position agar tidak muncul di setiap halaman
  return `
    <div class="tembusan-container">
      <p style="margin: 0 0 5px 0; color: #000000 !important; font-weight: bold;">Tembusan:</p>
      <ol style="margin: 0; padding-left: 0; list-style-type: none; color: #000000 !important; line-height: 1.4;">
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

export const suratTugasTableTemplate = (data: SuratTugasTableData): string => `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surat Tugas - FSM UNDIP</title>
  <style>
    /* Paged.js Configuration */
    @page {
      size: A4;
      margin: 15mm 20mm 25mm 20mm; /* Extra bottom margin for QR */
      
      @bottom-right {
        content: element(qr-running);
      }
    }
    
    /* QR Code Running Element - tampil di layar */
    .qr-running {
      position: fixed;
      bottom: 10mm;
      right: 10mm;
      text-align: center;
      padding: 2mm;
      background: white;
      z-index: 100;
    }
    
    .qr-running img {
      width: 60px;
      height: 60px;
    }
    
    .qr-running .qr-label {
      font-size: 5pt;
      color: #666666;
      margin-top: 1mm;
    }
    
    .qr-placeholder {
      width: 60px;
      height: 60px;
      border: 1px dashed #cccccc;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9f9f9;
    }
    
    .qr-placeholder-text {
      font-size: 5pt;
      color: #999999;
      text-align: center;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      /* QR di print mode - gunakan running element di setiap halaman */
      .qr-running {
        position: running(qr-running);
        bottom: auto;
        right: auto;
        background: none;
      }
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }
    html {
      margin: 0; padding: 0;
    }
    body {
      width: 210mm;
      margin: 0 auto;
      padding: 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1;
      color: #000000 !important;
      background: #ffffff !important;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    #surat-content {
      width: 210mm;
      margin: 0 auto;
      padding: 10mm 20mm 20mm 20mm;
      background: #ffffff;
      color: #000000 !important;
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
      table-layout: fixed;
    }
    .table-mahasiswa th {
      border: 1px solid #000000;
      padding: 8px;
      text-align: center;
      background-color: #d3d3d3;
      font-weight: bold;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .table-mahasiswa td {
      border: 1px solid #000000;
      padding: 8px;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
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
    .footer-section {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      break-inside: avoid;
    }
    .tembusan-container {
      flex: 1;
      max-width: 100%;
      font-size: 11pt;
      line-height: 1.4;
      break-inside: avoid;
    }
    .qr-code-box {
      text-align: center;
      padding: 5px;
      flex-shrink: 0;
    }
    .ttd-tembusan-wrapper {
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
      max-width: 100%;
    }
  </style>
</head>
<body style="color: #000000;">
  <!-- QR Code Running Footer - muncul di setiap halaman -->
  ${renderQRRunningFooter(data.qrCodeDataUrl)}
  
  <div id="surat-content">
    <div class="header-container" style="border-bottom: 3px solid #000000;">
      <div class="logo-container">
        <img src="/Undip-Logo.png" alt="Logo UNDIP" class="logo">
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
    <p style="text-align: right; margin-top: 30px; color: #000000 !important;">${data.tanggalSurat || 'Semarang, __ _______ _____'}</p>
    <div class="ttd-tembusan-wrapper">
      <div class="ttd-container">
        ${renderSignatures(data.signatures, data.stempelUrl)}
      </div>
    </div>
    <div class="footer-section">
      ${renderTembusan(data.tembusan)}
    </div>
  </div>

</body>
</html>`;
