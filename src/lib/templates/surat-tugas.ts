/**
 * Interface untuk blok tanda tangan
 */
export interface SignatureBlock {
  signerRole: string;      // "Dekan", "Wakil Dekan 1", dll
  signerName: string;      // Nama lengkap
  signerNip?: string;      // NIP
  signatureUrl?: string;   // URL gambar TTD (base64 data URL atau URL)
  signedAt?: string;       // Tanggal TTD (format: "29 Januari 2026")
  prefix?: string;         // Awalan seperti "Mengetahui,"
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

/**
 * Interface untuk data Surat Tugas
 */
export interface SuratTugasData {
  jenisSurat: 'tugas' | 'keputusan';
  jenisSuratText: string;
  nomorSurat: string;
  namaLengkap: string;
  nimNip: string;
  programStudi: string;
  keperluan: string;
  judulSurat: string;
  
  // Tanda tangan
  signatures?: SignatureBlock[];
  
  // Tanggal surat
  tanggalSurat?: string;  // Format: "Semarang, 29 Januari 2026"
  
  // QR Code untuk verifikasi
  qrCodeDataUrl?: string;  // QR Code sebagai data URL (base64)
  verificationUrl?: string; // URL untuk verifikasi dokumen
  
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
 * For 3 signatures layout: top-left (Wadek2), top-right (Wadek1), bottom-center (Dekan)
 */
const sortSignaturesByHierarchy = (signatures: SignatureBlock[]): SignatureBlock[] => {
  if (signatures.length !== 3) return signatures;
  
  const getHierarchyRank = (role: string): number => {
    const upperRole = role.toUpperCase();
    if (upperRole.includes('DEKAN') && !upperRole.includes('WAKIL')) return 3; // Tertinggi
    if (upperRole.includes('WAKIL') && upperRole.includes('1')) return 2; // Wadek 1
    if (upperRole.includes('WAKIL') && upperRole.includes('2')) return 1; // Wadek 2
    if (upperRole.includes('WADEK') && upperRole.includes('1')) return 2;
    if (upperRole.includes('WADEK') && upperRole.includes('2')) return 1;
    return 0;
  };
  
  const sorted = [...signatures].sort((a, b) => getHierarchyRank(a.signerRole) - getHierarchyRank(b.signerRole));
  
  // Layout: [0] = Wadek2 (top-left), [1] = Wadek1 (top-right), [2] = Dekan (bottom-center)
  return sorted;
};

/**
 * Helper untuk render semua blok tanda tangan dengan layout berdasarkan jumlah
 */
const renderSignatures = (signatures?: SignatureBlock[]): string => {
  if (!signatures || signatures.length === 0) {
    // Placeholder kosong jika belum ada tanda tangan
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
  
  // Sort signatures by hierarchy for proper layout
  const sortedSignatures = sortSignaturesByHierarchy(signatures);
  
  const count = sortedSignatures.length;
  const countClass = `ttd-count-${Math.min(count, 4)}`;
  
  const signatureBlocks = sortedSignatures.map(sig => renderSignatureBlock(sig)).join('');
  
  return `<div class="${countClass}">${signatureBlocks}</div>`;
};

/**
 * Helper untuk render QR Code
 */
const renderQRCode = (qrCodeDataUrl?: string, verificationUrl?: string): string => {
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
  
  // Tembusan sekarang menggunakan static position agar tidak muncul di setiap halaman
  return `
    <div class="tembusan-container">
      <p style="margin: 0 0 5px 0; color: #000000 !important; font-weight: bold;">Tembusan:</p>
      <ol style="margin: 0; padding-left: 20px; color: #000000 !important; line-height: 1.4;">
        ${recipients}
      </ol>
    </div>
  `;
};

export const suratTugasTemplate = (data: SuratTugasData): string => `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.jenisSuratText} - FSM UNDIP</title>
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
    @page {
      size: A4;
      margin: 3cm 2cm 3cm 2cm;
    }
    html, body {
      width: 21cm;
      min-height: 29.7cm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1;
      margin: 0;
      padding: 38px 76px 113px 76px;
      max-width: 21cm;
      color: #000000 !important;
      background: #ffffff !important;
      box-sizing: border-box;
      word-wrap: break-word;
      overflow-wrap: break-word;
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
      text-indent: 40px;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .penutup {
      margin: 15px 0;
      text-indent: 40px;
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
      position: static;
      margin-top: 30px;
      max-width: 300px;
      font-size: 11pt;
      line-height: 1.5;
      page-break-inside: avoid;
      clear: both;
      background: white;
    }
    /* Wrapper untuk TTD dan Tembusan agar tidak terpisah antar halaman */
    .ttd-tembusan-wrapper {
      page-break-inside: avoid;
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
    <h4 style="color: #000000;">${data.jenisSuratText}</h4>
    <p style="color: #000000;">Nomor : ${data.nomorSurat}</p>
  </div>
  <div class="isi-surat">
    <p style="color: #000000;">
      Dekan Fakultas Sains dan Matematika Universitas Diponegoro dengan ini ${data.jenisSurat === 'keputusan' ? 'memutuskan' : 'menugaskan'} kepada yang nama-namanya tercantum di bawah ini:
    </p>
    <table style="margin: 20px 0 20px 50px; width: calc(100% - 100px); color: #000000; border-collapse: collapse;">
      <tr>
        <td style="width: 120px; vertical-align: top; padding: 4px 0; color: #000000; line-height: 1.6;">Nama</td>
        <td style="width: 15px; vertical-align: top; padding: 4px 0; color: #000000; line-height: 1.6;">:</td>
        <td style="vertical-align: top; padding: 4px 0; color: #000000; line-height: 1.6;">${data.namaLengkap}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 4px 0; color: #000000; line-height: 1.6;">NIM/NIP</td>
        <td style="vertical-align: top; padding: 4px 0; color: #000000; line-height: 1.6;">:</td>
        <td style="vertical-align: top; padding: 4px 0; color: #000000; line-height: 1.6;">${data.nimNip}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 4px 0; color: #000000; line-height: 1.6;">Program Studi</td>
        <td style="vertical-align: top; padding: 4px 0; color: #000000; line-height: 1.6;">:</td>
        <td style="vertical-align: top; padding: 4px 0; text-transform: capitalize; color: #000000; line-height: 1.6;">${data.programStudi}</td>
      </tr>
    </table>
    <p style="text-indent: 50px; color: #000000;">
      Untuk <b style="color: #000000; font-weight: bold;">${data.keperluan}</b> terkait <b style="color: #000000; font-weight: bold;">${data.judulSurat}</b> pada Fakultas Sains dan Matematika Universitas Diponegoro.
    </p>
  </div>
  <div class="penutup">
    <p style="color: #000000;">Demikian surat ${data.jenisSurat === 'keputusan' ? 'keputusan' : 'tugas'} ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
  </div>
  ${data.tanggalSurat ? `<p style="text-align: right; margin-top: 30px; color: #000000 !important;">${data.tanggalSurat}</p>` : ''}
  <div class="ttd-tembusan-wrapper">
    <div class="ttd-container">
      ${renderSignatures(data.signatures)}
    </div>
    ${renderTembusan(data.tembusan)}
  </div>
  ${renderQRCode(data.qrCodeDataUrl, data.verificationUrl)}
</body>
</html>`;
