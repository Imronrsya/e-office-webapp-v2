export interface MahasiswaData {
  nama: string;
  nim: string;
  prodi: string;
}

export interface SuratTugasTableData {
  nomorSurat: string;
  dataMahasiswa: MahasiswaData[];
  keterangan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
}

export const suratTugasTableTemplate = (data: SuratTugasTableData): string => `<!DOCTYPE html>
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
      margin-top: 30px;
      margin-bottom: 25px;
    }
    .judul-surat h4 {
      margin: 0;
      text-decoration: underline;
      font-size: 12pt;
      font-weight: bold;
    }
    .judul-surat p {
      margin: 8px 0 0 0;
      font-size: 11pt;
    }
    .isi-surat {
      text-align: justify;
      margin: 25px 0;
      line-height: 1.8;
    }
    .table-mahasiswa {
      margin: 20px 0;
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
      margin: 25px 0;
      text-align: justify;
    }
    .ttd-container {
      margin-top: 50px;
      display: flex;
      justify-content: flex-end;
    }
    .ttd-box {
      text-align: flex-start;
      width: 300px;
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
    
    <table class="table-mahasiswa">
      <thead>
        <tr>
          <th style="color: #000000;">No</th>
          <th style="color: #000000;">Nama</th>
          <th style="color: #000000;">NIM</th>
          <th style="color: #000000;">PRODI</th>
        </tr>
      </thead>
      <tbody>
        ${(data.dataMahasiswa || []).map((mhs, index) => `
        <tr>
          <td style="color: #000000;">${index + 1}.</td>
          <td style="color: #000000;">${mhs.nama}</td>
          <td style="color: #000000;">${mhs.nim}</td>
          <td style="color: #000000;">${mhs.prodi}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    <p style="color: #000000;">
      Sebagai <b style="color: #000000;">${data.keterangan}</b> mulai tanggal ${data.tanggalMulai} s.d ${data.tanggalSelesai}.
    </p>
  </div>
  
  <div class="penutup">
    <p style="color: #000000;">Demikian untuk dilaksanakan dengan sebaik-baiknya dan memberikan laporan setelah selesai.</p>
  </div>
  
  <div class="ttd-container">
    <div class="ttd-box">
      <p style="color: #ffffff;"></p>
      <p style="color: #ffffff;"></p>
      <p class="nama-pejabat" style="color: #ffffff;"></p>
      <p style="color: #ffffff;"></p>
    </div>
  </div>
</body>
</html>`;
