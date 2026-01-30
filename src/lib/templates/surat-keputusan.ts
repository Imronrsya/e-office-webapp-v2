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
  
  // QR Code untuk verifikasi
  qrCodeDataUrl?: string;
  verificationUrl?: string;
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
      ${signature.prefix ? `<p style="margin: 0 0 5px 0; font-style: italic;">${signature.prefix}</p>` : ''}
      <p style="margin: 0 0 5px 0;">${signature.signerRole}</p>
      ${signatureImage}
      <p style="margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;">${signature.signerName}</p>
      ${signature.signerNip ? `<p style="margin: 2px 0 0 0; font-size: 10pt;">NIP. ${signature.signerNip}</p>` : ''}
    </div>
  `;
};

/**
 * Helper untuk render semua blok tanda tangan dengan layout berdasarkan jumlah
 */
const renderSignatures = (signatures?: SignatureBlock[]): string => {
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
  
  const count = signatures.length;
  const countClass = `ttd-count-${Math.min(count, 4)}`;
  
  const signatureBlocks = signatures.map(sig => renderSignatureBlock(sig)).join('');
  
  return `<div class="${countClass}">${signatureBlocks}</div>`;
};

/**
 * Helper untuk render QR Code
 */
const renderQRCode = (qrCodeDataUrl?: string): string => {
  if (!qrCodeDataUrl) return '';
  
  return `
    <div class="qr-code-container" style="position: fixed; bottom: 20px; right: 20px; text-align: center; background: white; padding: 5px; z-index: 1000;">
      <img src="${qrCodeDataUrl}" alt="QR Code Verifikasi" style="width: 80px; height: 80px;" />
      <p style="margin: 2px 0 0 0; font-size: 6pt; color: #666666;">Scan untuk verifikasi</p>
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
      font-size: 11pt;
      line-height: 1.6;
      margin: 0;
      padding: 30px 50px;
      max-width: 21cm;
      color: #000000 !important;
      background: #ffffff !important;
    }
    .logo-container {
      text-align: center;
      margin-bottom: 20px;
    }
    .logo {
      width: 80px;
      height: auto;
    }
    .judul-keputusan {
      text-align: center;
      margin-bottom: 25px;
      line-height: 1.4;
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
    }
    .section-header {
      display: flex;
      align-items: flex-start;
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
      text-align: justify;
    }
    .keputusan-section {
      margin: 20px 0;
    }
    .keputusan-point {
      margin: 15px 0;
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
    }
    .table-peserta th,
    .table-peserta td {
      border: 1px solid #000000;
      padding: 6px 8px;
      font-size: 10pt;
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
      text-align: center;
    }
    
    /* 1 TTD → kanan bawah */
    .ttd-count-1 {
      display: flex;
      justify-content: flex-end;
    }

    /* 2 TTD → kiri & kanan (yang lebih tinggi di kanan) */
    .ttd-count-2 {
      display: flex;
      justify-content: space-between;
    }

    /* 3 TTD: Wadek2 kiri atas, Dekan kanan atas, Wadek1 bawah tengah */
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
    .qr-code-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      text-align: center;
      background: white;
      padding: 5px;
      z-index: 1000;
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
    }
  </style>
</head>
<body>
  <div class="logo-container">
    <img src="https://mm.feb.undip.ac.id/wp-content/uploads/2021/11/universitas-diponegoro-logo.png" alt="Logo UNDIP" class="logo">
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
  
  <div class="keputusan-section">
    ${data.keputusan.map((item) => `
    <div class="keputusan-point">
      <div style="display: flex; align-items: flex-start;">
        <div style="min-width: 120px; flex-shrink: 0;"><span class="keputusan-label">${item.label}</span></div>
        <div style="min-width: 20px; flex-shrink: 0;">:</div>
        <div style="flex: 1; text-align: justify;">${item.content}</div>
      </div>
    </div>
    `).join('')}
  </div>
  
  <div class="ttd-section">
    ${renderSignatures(data.signatures)}
  </div>
  ${renderQRCode(data.qrCodeDataUrl)}
  
  ${data.lampiran && data.dataPeserta ? `
  <div style="page-break-before: always; margin-top: 50px;">
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
      ${renderSignatures(data.signatures)}
    </div>
  </div>
  ` : ''}
  ${renderQRCode(data.qrCodeDataUrl)}
</body>
</html>`;
