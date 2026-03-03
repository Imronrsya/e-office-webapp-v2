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

export interface PesertaData {
  nama: string;
  nim: string;
}

export interface KeputusanItem {
  label: string;
  content: string;
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

export interface SuratKeputusanData {
  nomorSurat: string;
  tentang: string;
  menimbang: string[];
  mengingat: string[];
  menetapkan: string;
  keputusan: KeputusanItem[];
  tanggalDitetapkan: string;
  lampiran?: boolean;
  dataPeserta?: PesertaData[];

  // Tanda tangan
  signatures?: SignatureBlock[];

  // Stempel URL
  stempelUrl?: string;

  // QR Code untuk verifikasi
  qrCodeDataUrl?: string;
  verificationUrl?: string;

  // Tembusan - daftar penerima salinan surat
  tembusan?: TembusanRecipient[];

  // Watermark DRAFT - tampilkan selama belum COMPLETED
  showDraftWatermark?: boolean;
}

/**
 * Get hierarchy rank for signature role
 * Higher rank = higher position
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
 * Priority: Dekan > Wadek 1 > Wadek 2
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

  // Stempel overlay untuk jabatan tertinggi yang ada di surat
  // Posisi: di kiri tanda tangan, sedikit overlap
  const stempelOverlay = shouldHaveStempel && stempelUrl ? `
    <div style="position: absolute; top: 0; left: -30px; width: 100px; height: 100px; opacity: 0.9; z-index: 10; pointer-events: none;">
      <img src="${stempelUrl}" alt="Stempel" style="width: 100%; height: 100%; object-fit: contain;" crossorigin="anonymous" />
    </div>
  ` : '';

  return `
    <div class="signature-block" style="text-align: center; min-width: 200px; position: relative;">
      ${signature.prefix ? `<p style="margin: 0 0 5px 0; font-style: italic;">${signature.prefix}</p>` : ''}
      <p style="margin: 0 0 5px 0;">${getRoleDisplayLabel(signature.signerRole)}</p>
      <div style="position: relative; display: inline-block; margin-top: 20px;">
        ${stempelOverlay}
        ${signatureImage}
      </div>
      <p style="margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;">${signature.signerName}</p>
      ${signature.signerNip ? `<p style="margin: 2px 0 0 0; font-size: 10pt;">NIP. ${signature.signerNip}</p>` : ''}
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
        <p class="ttd-text" style="color: white"></p>
        <p class="ttd-text" style="color: white"></p>
        <p class="nama-pejabat" style="color: white"></p>
        <p class="ttd-text" style="color: white"></p>
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
      </div>
    `;
  }

  // Placeholder when QR code not yet generated
  return '';
};

/**
 * Helper untuk render QR Code di footer section (backward compat - returns empty)
 */
const renderQRCode = (qrCodeDataUrl?: string): string => {
  // QR Code sekarang di-render sebagai running footer, bukan di sini
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

  // Menggunakan position static agar tidak muncul di setiap halaman saat print
  return `
    <div class="tembusan-container">
      <p style="margin: 0 0 5px 0; color: #000000 !important; font-weight: bold;">Tembusan:</p>
      <ol style="margin: 0; padding-left: 0; list-style-type: none; color: #000000 !important; line-height: 1.4;">
        ${recipients}
      </ol>
    </div>
  `;
};

export const suratKeputusanTemplate = (data: SuratKeputusanData): string => `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surat Keputusan Dekan - FSM UNDIP</title>
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
        background: #ffffff !important;
      }
      #surat-content, .lampiran-content {
        padding: 0 !important;
        box-shadow: none !important;
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
      font-size: 11pt;
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
    .lampiran-content {
      width: 210mm;
      margin: 0 auto;
      padding: 15mm 20mm 20mm 20mm;
      background: #ffffff;
      color: #000000 !important;
      page-break-before: always;
    }
    .force-page-break {
      /* Marker class for JS pagination to force a new page before this element */
    }
    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      margin-bottom: 20px;
    }
    .logo {
      width: 80px;
      height: auto;
    }
    .judul-keputusan {
      text-align: center;
      margin-bottom: 25px;
      line-height: 1.2;
    }
    .judul-keputusan h4 {
      margin: 3px 0;
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .judul-keputusan p {
      margin: 3px 0;
      font-size: 11pt;
    }
    .tentang {
      text-align: center;
      margin: 20px 0;
      text-transform: uppercase;
    }
    .section-title {
      margin-top: 20px;
      margin-bottom: 10px;
      text-align: center;
    }
    .content-section {
      text-align: justify;
      margin: 15px 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .section-header {
      display: flex;
      align-items: flex-start;
      max-width: 100%;
    }
    .section-label {
      min-width: 120px;
      flex-shrink: 0;
    }
    .section-colon {
      min-width: 20px;
      flex-shrink: 0;
    }
    .section-content {
      flex: 1;
      min-width: 0;
      max-width: calc(100% - 140px);
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .point-list {
      margin-left: 0;
    }
    .point-item {
      display: flex;
      margin-bottom: 10px;
      text-align: justify;
    }
    .point-number {
      min-width: 25px;
      flex-shrink: 0;
    }
    .point-content {
      flex: 1;
      min-width: 0;
      text-align: justify;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .keputusan-section {
      margin: 20px 0;
      max-width: 100%;
    }
    .keputusan-point {
      margin: 15px 0;
      max-width: 100%;
    }
    .keputusan-label {
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    .keputusan-content {
      margin-left: 100px;
      text-align: justify;
    }
    .table-peserta {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      table-layout: fixed;
    }
    .table-peserta th,
    .table-peserta td {
      border: 1px solid #000000;
      padding: 6px 8px;
      font-size: 10pt;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .table-peserta th {
      background-color: #d3d3d3;
      font-weight: bold;
      text-align: center;
    }
    .table-peserta td:first-child {
      text-align: center;
      width: 5%;
    }
    .table-peserta td:nth-child(2) {
      width: 60%;
    }
    .table-peserta td:nth-child(3) {
      text-align: center;
      width: 35%;
    }
    .ttd-section {
      margin-top: 40px;
      clear: both;
    }
    
    /* 1 TTD → kanan bawah */
    .ttd-count-1 {
      display: flex;
      justify-content: flex-end;
    }

    /* 2 TTD → kiri & kanan */
    .ttd-count-2 {
      display: flex;
      justify-content: space-between;
    }

    /* 3 TTD: Wadek1 kiri atas, Dekan kanan atas, Wadek2 bawah tengah */
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

    .signature-block {
      display: inline-block;
      text-align: center;
      min-width: 200px;
    }
    .ttd-text {
      margin: 3px 0;
    }
    .nama-pejabat {
      margin-top: 60px;
      font-weight: normal;
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
      line-height: 1.5;
      break-inside: avoid;
    }
    .qr-code-box {
      text-align: center;
      padding: 5px;
      flex-shrink: 0;
    }
    .memutuskan-wrapper {
    }
    .footer-section-wrapper {
    }
    table {
      max-width: 100%;
    }
    b, strong {
      font-weight: bold !important;
    }
    /* DRAFT Watermark - background repeating di seluruh konten (semua halaman) */
    #surat-content.has-draft-watermark,
    #lampiran-content.has-draft-watermark {
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Ctext x='300' y='200' dominant-baseline='middle' text-anchor='middle' transform='rotate(-45,300,200)' font-size='80' font-family='Times New Roman' font-weight='bold' fill='rgba(0,0,0,0.05)'%3EDRAFT%3C/text%3E%3C/svg%3E");
      background-repeat: repeat;
      background-size: 600px 400px;
    }
  </style>
</head>
<body>
  <!-- QR Code Running Footer - muncul di setiap halaman -->
  ${renderQRRunningFooter(data.qrCodeDataUrl)}
  
  <div id="surat-content" class="${data.showDraftWatermark ? 'has-draft-watermark' : ''}">
    <div class="logo-container">
      <img src="/Undip-Logo.png" alt="Logo UNDIP" class="logo">
    </div>
    
    <div class="judul-keputusan">
      <h4>KEPUTUSAN DEKAN FAKULTAS SAINS DAN MATEMATIKA</h4>
      <h4>UNIVERSITAS DIPONEGORO</h4>
      <p><b>NOMOR : ${data.nomorSurat}</b></p>
    </div>
    
    <div class="tentang">
      <p><b>TENTANG</b></p>
      <p style="font-style: italic;">${data.tentang}</p>
    </div>
    
    <div class="section-title">
      <p>DEKAN FAKULTAS SAINS DAN MATEMATIKA</p>
    </div>
    
    <div class="content-section">
      <div class="section-header">
        <div class="section-label">Menimbang</div>
        <div class="section-colon">:</div>
        <div class="section-content">
          <div class="point-list">
            ${data.menimbang.map((item, index) => `
            <div class="point-item">
              <div class="point-number">${String.fromCharCode(97 + index)}.</div>
              <div class="point-content">${item}</div>
            </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    
    <div class="content-section">
      <div class="section-header">
        <div class="section-label">Mengingat</div>
        <div class="section-colon">:</div>
        <div class="section-content">
          <div class="point-list">
            ${data.mengingat.map((item, index) => `
            <div class="point-item">
              <div class="point-number">${index + 1}.</div>
              <div class="point-content">${item}</div>
            </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    
    <div class="memutuskan-wrapper">
      <div class="section-title">
        <p>MEMUTUSKAN</p>
      </div>
      
      <div class="content-section">
        <div class="section-header">
          <div class="section-label">Menetapkan</div>
          <div class="section-colon">:</div>
          <div class="section-content">
            <p style="margin: 0; text-align: justify;">${data.menetapkan}</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="keputusan-section">
      ${data.keputusan.map((item) => `
      <div class="keputusan-point">
        <div style="display: flex; align-items: flex-start; max-width: 100%;">
          <div style="min-width: 120px; flex-shrink: 0;"><span class="keputusan-label">${item.label}</span></div>
          <div style="min-width: 20px; flex-shrink: 0;">:</div>
          <div style="flex: 1; min-width: 0; max-width: calc(100% - 140px); text-align: justify; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${item.content}</div>
        </div>
      </div>
      `).join('')}
    </div>
    
    <div class="footer-section-wrapper">
      <div class="tanggal-ditetapkan" style="text-align: right; margin-top: 30px; margin-bottom: 20px;">
        <p style="margin: 0;">Ditetapkan di Semarang</p>
        <p style="margin: 0;">pada tanggal ${data.tanggalDitetapkan}</p>
      </div>
      
      <div class="ttd-section">
        ${renderSignatures(data.signatures, data.stempelUrl)}
      </div>
      
      <div class="footer-section">
        ${renderTembusan(data.tembusan)}
      </div>
    </div>
  </div>
  
  ${data.lampiran && data.dataPeserta ? `
  <div id="lampiran-content" class="lampiran-content force-page-break ${data.showDraftWatermark ? 'has-draft-watermark' : ''}">
    <div class="content-section">
      <div class="section-header">
        <div class="section-label">LAMPIRAN:</div>
        <div class="section-content">
          <div class="point-item">
            <div class="point-content">KEPUTUSAN DEKAN FAKULTAS SAINS DAN MATEMATIKA UNIVERSITAS DIPONEGORO</div>
          </div>
          <div class="point-item">
            <div class="point-content">NOMOR : ${data.nomorSurat}</div>
          </div>
          <div class="point-item">
            <div class="point-content">TENTANG</div>
          </div>
          <div class="point-item">
            <div class="point-content">${data.tentang}</div>
          </div>
        </div>
      </div>
    </div>
    
    <p style="text-align: left; margin: 20px 0;">Panitia</p>
    
    <table class="table-peserta">
      <thead>
        <tr>
          <th>No</th>
          <th>Nama</th>
          <th>NIM</th>
        </tr>
      </thead>
      <tbody>
        ${data.dataPeserta.map((peserta, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${peserta.nama}</td>
          <td>${peserta.nim}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="ttd-section">
      ${renderSignatures(data.signatures, data.stempelUrl)}
    </div>
    
    <div class="footer-section">
    </div>
  </div>
  ` : ''}
  

</body>
</html>`;
