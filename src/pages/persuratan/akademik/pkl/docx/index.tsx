import { DownloadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import base64Logo from "./logo";
import {
  AlignmentType,
  convertInchesToTwip,
  Document,
  ExternalHyperlink,
  Header,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  TabStopType,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import QRCode from "qrcode";

// Type definitions
interface FormData {
  tanggal_surat?: string; // Tanggal pembuatan surat
  nomor_surat?: string; // Nomor surat resmi
  lampiran?: string; // Daftar lampiran surat
  hal?: string; // Perihal/subjek surat
  tujuan_surat?: string; // Alamat dan tujuan surat
  isi_surat?: string; // Konten utama surat
  tembusan?: string[]; // Daftar penerima tembusan
  Progress?: Array<{
    // Data progress persetujuan
    role: { nama: string };
    status: string;
  }>;
  surat_masuk?: {
    // Data surat masuk terkait
    id: string;
  };
}

interface Props {
  formData?: FormData; // Data dari form input pengguna
  dataTambahan?: any; // Data tambahan dari API atau sumber lain
}

// Fungsi bantuan untuk mengecek apakah Wakil Dekan sudah menyetujui
const hasWakilDekanApproval = (progress?: FormData["Progress"]): boolean => {
  return (
    progress?.some(
      (p) => p.role.nama === "wakil dekan 1" && p.status === "DISETUJUI",
    ) || false
  );
};

// Fungsi bantuan untuk mengubah HTML menjadi teks biasa (disederhanakan)
const htmlToText = (html?: string): string => {
  if (!html) return "";
  return html
    .replace(/<div[^>]*>/gi, "\n") // Ubah tag div menjadi baris baru
    .replace(/<\/div>/gi, "\n") // Ubah tag penutup div menjadi baris baru
    .replace(/<br\s*\/?>/gi, "\n") // Ubah tag br menjadi baris baru
    .replace(/<\/p>/gi, "\n\n") // Ubah tag penutup p menjadi dua baris baru untuk spasi
    .replace(/<p[^>]*>/gi, "") // Hapus tag pembuka p tapi pertahankan konten
    .replace(/<strong>/gi, "") // Hapus tag strong tapi pertahankan konten
    .replace(/<\/strong>/gi, "")
    .replace(/<[^>]*>/g, "") // Hapus semua tag HTML yang tersisa
    .replace(/&nbsp;/g, " ") // Ubah spasi HTML menjadi spasi biasa
    .replace(/\n\s*\n\s*\n/g, "\n\n") // Ubah banyak baris baru menjadi dua baris baru
    .replace(/^\s+|\s+$/g, "") // Hapus spasi kosong dari awal dan akhir
    .replace(/[ \t]+/g, " "); // Ganti banyak spasi/tab dengan satu spasi
};

// Fungsi bantuan untuk mengubah HTML menjadi paragraf DOCX
const htmlToParagraphs = (html?: string): Paragraph[] => {
  if (!html) return [new Paragraph({ text: "" })];

  // Pisahkan HTML menjadi bagian-bagian berdasarkan pemisah paragraf
  const sections = html
    .split(/<\/p>/)
    .map((section) => section.replace(/<p[^>]*>/gi, "").trim())
    .filter((section) => section.length > 0);

  const paragraphs: Paragraph[] = [];

  sections.forEach((section, index) => {
    // Bersihkan tag HTML tapi pertahankan format dasar
    const cleanText = section
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<strong>/gi, "")
      .replace(/<\/strong>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    if (cleanText) {
      // Cek apakah ini bagian penerima surat (Yang terhormat)
      const isRecipientSection =
        cleanText.includes("Yang terhormat") || cleanText.includes("Yth.");
      // Cek apakah ini bagian data mahasiswa (Nama, NIM, atau Judul)
      const isStudentDataSection =
        (cleanText.includes("Nama") && cleanText.includes(":")) ||
        (cleanText.includes("NIM") && cleanText.includes(":")) ||
        (cleanText.includes("Judul") && cleanText.includes(":"));
      // Cek apakah ini data mahasiswa terakhir (Judul)
      const isLastStudentData =
        cleanText.includes("Judul") && cleanText.includes(":");
      // Cek apakah ini paragraf sebelum data mahasiswa (berakhir dengan "di bawah ini:")
      const isBeforeStudentData = cleanText.endsWith("di bawah ini:");
      // Cek apakah ini paragraf setelah data mahasiswa (dimulai dengan "dengan ini mohon")
      const isAfterStudentData = cleanText.startsWith("dengan ini mohon");

      if (isRecipientSection) {
        // Untuk bagian penerima, PERTAHANKAN DALAM SATU BARIS alih-alih dipecah per baris
        // Ganti semua baris baru dengan spasi untuk membuatnya jadi satu paragraf
        const singleLineText = cleanText
          .replace(/\n/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: singleLineText,
                font: "Times New Roman",
                size: 24, // 12pt
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: {
              line: 250, // Spasi baris normal
              after: 200, // Spasi normal setelah bagian penerima
            },
          }),
        );
      } else if (isBeforeStudentData) {
        // Untuk paragraf sebelum data mahasiswa, tambahkan spasi ekstra setelahnya
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText,
                font: "Times New Roman",
                size: 24, // 12pt
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              line: 280, // Spasi baris 1.5
              after: 100, // Spasi ekstra sebelum data mahasiswa (sama seperti setelah Judul)
            },
          }),
        );
      } else if (isStudentDataSection) {
        // Untuk bagian data mahasiswa, gunakan spasi minimal
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText,
                font: "Times New Roman",
                size: 24, // 12pt
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: {
              line: 280, // Spasi baris normal
              after: isLastStudentData ? 100 : 50, // Spasi ekstra setelah Judul, minimal untuk yang lain
            },
          }),
        );
      } else if (isAfterStudentData) {
        // Untuk paragraf setelah data mahasiswa, gunakan spasi normal (tanpa spasi ekstra sebelumnya)
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText,
                font: "Times New Roman",
                size: 24, // 12pt
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              line: 280, // Spasi baris 1.5
              after: 100, // Spasi normal setelahnya
            },
          }),
        );
      } else {
        // Untuk bagian lainnya (konten isi), gunakan spasi paragraf normal
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText,
                font: "Times New Roman",
                size: 24, // 12pt
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              line: 280, // Spasi baris 1.5
              after: index < sections.length - 1 ? 100 : 50, // Spasi antar paragraf
            },
          }),
        );
      }
    }
  });

  return paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: "" })];
};

// Fungsi bantuan untuk membuat QR code sebagai base64
const generateQRCode = async (url: string): Promise<string | null> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: 100,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCodeDataURL.split(",")[1]; // Remove data:image/png;base64, prefix
  } catch (error) {
    console.error("Error generating QR code:", error);
    return null;
  }
};

// Hardcoded base64 logo as fallback
const LOGO_BASE64_FALLBACK =
  "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";

// Helper function to load image as base64 - enhanced with debugging and fallback
const loadImageAsBase64 = async (imagePath: string): Promise<string | null> => {
  try {
    // console.log('Attempting to load image from:', imagePath);
    const response = await fetch(imagePath);
    // console.log('Fetch response status:', response.status, response.statusText);

    if (!response.ok) {
      // console.log('Response not ok, status:', response.status);
      return null;
    }

    const blob = await response.blob();
    // console.log('Blob size:', blob.size, 'Type:', blob.type);

    if (blob.size === 0) {
      // console.log('Blob size is 0');
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result) {
          const base64 = result.split(",")[1];
          // console.log('Base64 conversion successful, length:', base64?.length);
          resolve(base64);
        } else {
          // console.log('FileReader result is null');
          resolve(null);
        }
      };
      reader.onerror = (error) => {
        // console.log('FileReader error:', error);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error in loadImageAsBase64:", error);
    return null;
  }
};

const DownloadDOCXSuratPengantarAK15: React.FC<Props> = ({
  formData = {},
  dataTambahan = {},
}) => {
  const isApproved = hasWakilDekanApproval(formData?.Progress);
  let trackingUrl = "";

  // AES encryption helpers to align with other templates
  function toBase64(arr: Uint8Array): string {
    return btoa(String.fromCharCode(...arr));
  }
  const encryptAES = async (text: string) => {
    const subtle = (window as any).crypto?.subtle;
    if (!subtle) return "";
    const keyString = "apps-persuratan!";
    const keyBuffer = new TextEncoder().encode(keyString.padEnd(32, "0"));
    const iv = (window as any).crypto.getRandomValues(new Uint8Array(16));
    const cryptoKey = await subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-CBC" },
      false,
      ["encrypt", "decrypt"],
    );
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const encryptedData = await subtle.encrypt(
      { name: "AES-CBC", iv },
      cryptoKey,
      data,
    );
    const ciphertext = toBase64(new Uint8Array(encryptedData));
    const ivBase64 = toBase64(iv);
    const safeCiphertext = ciphertext.replace(/\//g, "sl4shbR0");
    const safeIvBase64 = ivBase64.replace(/\//g, "sl4shbR0");
    return `${safeCiphertext}-${safeIvBase64}`;
  };

  if (isApproved && formData?.surat_masuk?.id) {
    // encrypt the ID for tracking
    // Note: this is async; we compute and use synchronously inside generateDocument before QR generation
    // Here, set a placeholder; actual value computed in generateDocument
  }

  // Debug: Log data yang diterima
  // console.log('🔍 DOCX Component Data:');
  // console.log('formData:', formData);
  // console.log('dataTambahan:', dataTambahan);

  // Gabungkan data dari formData dan dataTambahan
  const mergedData = {
    ...dataTambahan, // Data dari API (detailData)
    ...formData, // Data dari form (bisa override jika ada)
  };

  // console.log('📄 Merged Data:', mergedData);
  const generateDocument = async () => {
    try {
      // Compute encrypted tracking URL if approved
      let encryptedId = "";
      if (isApproved && formData?.surat_masuk?.id) {
        encryptedId = await encryptAES(String(formData.surat_masuk.id));
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const PUBLIC_BASE = "/persuratan-mahasiswa";
        trackingUrl = encryptedId
          ? `${origin}${PUBLIC_BASE}/tracking/${encryptedId}`
          : "";
      }
      // Try to load logo with multiple approaches
      // console.log('Starting logo loading...');
      let logoBase64 = await loadImageAsBase64(
        `${window.location.origin}/logo_undip.png`,
      );

      if (!logoBase64) {
        // console.log('Primary method failed, trying direct path...');
        logoBase64 = await loadImageAsBase64("/logo_undip.png");
      }

      if (!logoBase64) {
        // console.log('All fetch methods failed, using hardcoded fallback logo...');
        logoBase64 = LOGO_BASE64_FALLBACK;
      }

      // console.log('Final logoBase64 result:', logoBase64 ? 'SUCCESS' : 'FAILED');
      // console.log('Logo base64 length:', logoBase64?.length || 0);

      const signatureBase64 = isApproved
        ? await loadImageAsBase64("/images/signature.png")
        : null;

      // Generate QR code if approved
      const qrCodeBase64 =
        isApproved && trackingUrl ? await generateQRCode(trackingUrl) : null;

      const doc = new Document({
        creator: "E-Office Mahasiswa FSM UNDIP",
        title: "Surat Pengantar Akademik",
        description: "Generated by E-Office System",
        sections: [
          {
            properties: {
              page: {
                size: {
                  width: 12240, // A4 width in twips
                  height: 15840, // A4 height in twips
                  orientation: PageOrientation.PORTRAIT,
                },
                margin: {
                  top: convertInchesToTwip(1.0),
                  right: convertInchesToTwip(1.0),
                  bottom: convertInchesToTwip(1.0),
                  left: convertInchesToTwip(1.0),
                  header: convertInchesToTwip(0.5),
                  footer: convertInchesToTwip(0.5),
                },
              },
            },
            headers: {
              default: new Header({
                children: [
                  // Header with logo and university info
                  new Table({
                    margins: {
                      left: convertInchesToTwip(-2.5), // Geser header ke kiri lebih jauh
                      right: convertInchesToTwip(0),
                      top: convertInchesToTwip(0.2),
                      bottom: convertInchesToTwip(0.1),
                    },
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [
                              new Paragraph({
                                children: logoBase64
                                  ? [
                                      new ImageRun({
                                        data: Buffer.from(base64Logo, "base64"),
                                        transformation: {
                                          width: 70,
                                          height: 80,
                                        },
                                        type: "png",
                                      }),
                                    ]
                                  : [new TextRun({ text: "" })],
                                alignment: AlignmentType.LEFT,
                              }),
                            ],
                            width: { size: 3, type: WidthType.PERCENTAGE },
                            margins: {
                              top: convertInchesToTwip(0.1),
                              bottom: convertInchesToTwip(0.1),
                              left: convertInchesToTwip(0),
                              right: convertInchesToTwip(0.1),
                            },
                            borders: {
                              top: { style: "none", size: 0, color: "FFFFFF" },
                              bottom: {
                                style: "none",
                                size: 0,
                                color: "FFFFFF",
                              },
                              left: { style: "none", size: 0, color: "FFFFFF" },
                              right: {
                                style: "none",
                                size: 0,
                                color: "FFFFFF",
                              },
                            },
                          }),
                          new TableCell({
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI",
                                    size: 22, // 10pt
                                    font: "Times New Roman",
                                    bold: false,
                                    color: "000000", // ubah ke hitam
                                  }),
                                ],
                                alignment: AlignmentType.LEFT,
                              }),
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "UNIVERSITAS DIPONEGORO",
                                    size: 28, // 14pt
                                    bold: false,
                                    font: "Times New Roman",
                                    color: "000000", // ubah ke hitam
                                  }),
                                ],
                                alignment: AlignmentType.LEFT,
                              }),
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "FAKULTAS SAINS DAN MATEMATIKA",
                                    size: 28, // 12pt
                                    bold: false,
                                    font: "Times New Roman",
                                    color: "000000", // ubah ke hitam
                                  }),
                                ],
                                alignment: AlignmentType.LEFT,
                              }),
                            ],
                            width: { size: 60, type: WidthType.PERCENTAGE },
                            margins: {
                              top: convertInchesToTwip(0.1),
                              bottom: convertInchesToTwip(0.1),
                              left: convertInchesToTwip(0.1),
                              right: convertInchesToTwip(0.1),
                            },
                            borders: {
                              top: { style: "none", size: 0, color: "FFFFFF" },
                              bottom: {
                                style: "none",
                                size: 0,
                                color: "FFFFFF",
                              },
                              left: { style: "none", size: 0, color: "FFFFFF" },
                              right: {
                                style: "none",
                                size: 0,
                                color: "FFFFFF",
                              },
                            },
                          }),
                          new TableCell({
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "Jalan Prof. Jacub Rais",
                                    size: 14, // 7pt
                                    font: "Times New Roman",
                                    color: "000000", // ubah ke hitam
                                  }),
                                ],
                                alignment: AlignmentType.RIGHT,
                              }),
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "Kampus Universitas Diponegoro",
                                    size: 14,
                                    font: "Times New Roman",
                                    color: "000000", // ubah ke hitam
                                  }),
                                ],
                                alignment: AlignmentType.RIGHT,
                              }),
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "Tembalang, Semarang, Kode Pos 50275",
                                    size: 14,
                                    font: "Times New Roman",
                                    color: "000000", // ubah ke hitam
                                  }),
                                ],
                                alignment: AlignmentType.RIGHT,
                              }),
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "Telp (024) 7474754 Fax (024) 76480690",
                                    size: 14,
                                    font: "Times New Roman",
                                    color: "000000", // ubah ke hitam
                                  }),
                                ],
                                alignment: AlignmentType.RIGHT,
                              }),
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "Laman: www.fsm.undip.ac.id",
                                    size: 14,
                                    font: "Times New Roman",
                                    color: "000000", // ubah ke hitam
                                  }),
                                ],
                                alignment: AlignmentType.RIGHT,
                              }),
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: "Pos-el: fsm@undip.ac.id",
                                    size: 14,
                                    font: "Times New Roman",
                                    color: "000000", // ubah ke hitam
                                  }),
                                ],
                                alignment: AlignmentType.RIGHT,
                              }),
                            ],
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            margins: {
                              top: convertInchesToTwip(0.1),
                              bottom: convertInchesToTwip(0.1),
                              left: convertInchesToTwip(0.1),
                              right: convertInchesToTwip(0.1),
                            },
                            borders: {
                              top: { style: "none", size: 0, color: "FFFFFF" },
                              bottom: {
                                style: "none",
                                size: 0,
                                color: "FFFFFF",
                              },
                              left: { style: "none", size: 0, color: "FFFFFF" },
                              right: {
                                style: "none",
                                size: 0,
                                color: "FFFFFF",
                              },
                            },
                          }),
                        ],
                      }),
                    ],
                    width: { size: 102, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: "none", size: 0, color: "FFFFFF" },
                      bottom: { style: "none", size: 0, color: "FFFFFF" },
                      left: { style: "none", size: 0, color: "FFFFFF" },
                      right: { style: "none", size: 0, color: "FFFFFF" },
                    },
                  }),
                ],
              }),
            },
            children: [
              // Number and Date in one line
              new Table({
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Nomor",
                                font: "Times New Roman",
                                size: 24, // 12pt
                              }),
                              new TextRun({
                                text: "\t: ",
                                font: "Times New Roman",
                                size: 24,
                              }),
                              new TextRun({
                                text: mergedData?.nomor_surat || "",
                                font: "Times New Roman",
                                size: 24,
                              }),
                            ],
                            tabStops: [
                              {
                                type: TabStopType.LEFT,
                                position: convertInchesToTwip(0.8),
                              },
                            ],
                          }),
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: "none", size: 0, color: "FFFFFF" },
                          bottom: { style: "none", size: 0, color: "FFFFFF" },
                          left: { style: "none", size: 0, color: "FFFFFF" },
                          right: { style: "none", size: 0, color: "FFFFFF" },
                        },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: mergedData?.tanggal_surat
                                  ? new Date(
                                      mergedData.tanggal_surat,
                                    ).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })
                                  : "",
                                font: "Times New Roman",
                                size: 24, // 12pt
                              }),
                            ],
                            alignment: AlignmentType.RIGHT,
                          }),
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: "none", size: 0, color: "FFFFFF" },
                          bottom: { style: "none", size: 0, color: "FFFFFF" },
                          left: { style: "none", size: 0, color: "FFFFFF" },
                          right: { style: "none", size: 0, color: "FFFFFF" },
                        },
                      }),
                    ],
                  }),
                ],
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: "none", size: 0, color: "FFFFFF" },
                  bottom: { style: "none", size: 0, color: "FFFFFF" },
                  left: { style: "none", size: 0, color: "FFFFFF" },
                  right: { style: "none", size: 0, color: "FFFFFF" },
                },
                margins: {
                  top: 200,
                  bottom: 0,
                  left: 0,
                  right: 0,
                },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Lampiran",
                    font: "Times New Roman",
                    size: 24,
                  }),
                  new TextRun({
                    text: "\t: ",
                    font: "Times New Roman",
                    size: 24,
                  }),
                  new TextRun({
                    text: mergedData?.lampiran || "",
                    font: "Times New Roman",
                    size: 24,
                  }),
                ],
                tabStops: [
                  {
                    type: TabStopType.LEFT,
                    position: convertInchesToTwip(0.8),
                  },
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Hal.",
                    font: "Times New Roman",
                    size: 24,
                  }),
                  new TextRun({
                    text: "\t: ",
                    font: "Times New Roman",
                    size: 24,
                  }),
                  new TextRun({
                    text: mergedData?.hal || "",
                    font: "Times New Roman",
                    size: 24,
                  }),
                ],
                tabStops: [
                  {
                    type: TabStopType.LEFT,
                    position: convertInchesToTwip(0.8),
                  },
                ],
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Yth." + dataTambahan.tujuan_surat,
                    font: "Times New Roman",
                    size: 24,
                  }),
                ],
                spacing: { after: 75 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: dataTambahan.jabatan,
                    font: "Times New Roman",
                    size: 24,
                  }),
                ],
                spacing: { after: 75 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: dataTambahan.instansi,
                    font: "Times New Roman",
                    size: 24,
                  }),
                ],
                spacing: { after: 75 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: dataTambahan.alamat_instansi,
                    font: "Times New Roman",
                    size: 24,
                  }),
                ],
                tabStops: [
                  {
                    type: TabStopType.LEFT,
                    position: convertInchesToTwip(0.5),
                  },
                ],
                spacing: { after: 400 },
              }),

              // new Paragraph("Yth."),
              // new Paragraph(dataTambahan.tujuan_surat), // atau detailData.tujuan_surat
              // new Paragraph(dataTambahan.jabatan),
              // new Paragraph(dataTambahan.instansi),
              // new Paragraph(dataTambahan.alamat_instansi),

              // Recipient - multiple paragraphs for better formatting
              // ...htmlToParagraphs(mergedData?.tujuan_surat),

              // Letter content - multiple paragraphs for better formatting
              ...htmlToParagraphs(mergedData?.isi_surat),

              // Signature section
              new Table({
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: "" })], // Empty left column
                        width: { size: 37, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: "none", size: 400, color: "FFFFFF" },
                          bottom: { style: "none", size: 0, color: "FFFFFF" },
                          left: { style: "none", size: 0, color: "FFFFFF" },
                          right: { style: "none", size: 0, color: "FFFFFF" },
                        },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "a.n. Dekan,",
                                font: "Times New Roman",
                                size: 24, // 12pt
                              }),
                            ],
                            alignment: AlignmentType.LEFT,
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Wakil Dekan Akademik dan Kemahasiswaan,",

                                font: "Times New Roman",
                                size: 24, // 12pt
                              }),
                            ],
                            alignment: AlignmentType.LEFT,
                          }),
                          // Signature image (if approved)
                          ...(isApproved && signatureBase64
                            ? [
                                new Paragraph({
                                  children: [
                                    new ImageRun({
                                      data: Buffer.from(
                                        signatureBase64,
                                        "base64",
                                      ),
                                      transformation: {
                                        width: 150,
                                        height: 80,
                                      },
                                      type: "png",
                                    }),
                                  ],
                                  alignment: AlignmentType.LEFT,
                                  spacing: { before: 200, after: 200 },
                                }),
                              ]
                            : [
                                new Paragraph({ text: "" }),
                                new Paragraph({ text: "" }),
                                new Paragraph({ text: "" }),
                              ]),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Dr. Ngadiwiyana, S.Si., M.Si.",
                                underline: {},
                                font: "Times New Roman",
                                size: 24, // 12pt
                              }),
                            ],
                            alignment: AlignmentType.LEFT,
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "NIP. 196906201999031002",
                                font: "Times New Roman",
                                size: 24, // 12pt
                              }),
                            ],
                            alignment: AlignmentType.LEFT,
                          }),
                        ],
                        width: { size: 35, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: "none", size: 0, color: "FFFFFF" },
                          bottom: { style: "none", size: 0, color: "FFFFFF" },
                          left: { style: "none", size: 0, color: "FFFFFF" },
                          right: { style: "none", size: 0, color: "FFFFFF" },
                        },
                      }),
                    ],
                  }),
                ],
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: "none", size: 0, color: "FFFFFF" },
                  bottom: { style: "none", size: 0, color: "FFFFFF" },
                  left: { style: "none", size: 0, color: "FFFFFF" },
                  right: { style: "none", size: 0, color: "FFFFFF" },
                },
                margins: {
                  top: 800,
                  bottom: 0,
                  left: 0,
                  right: 0,
                },
              }),

              // Footer - Tembusan
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Tembusan:",
                    font: "Times New Roman",
                    size: 24, // 12pt
                  }),
                ],
                spacing: { before: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: mergedData?.tembusan?.join("\n") || "",
                    font: "Times New Roman",
                    size: 24, // 12pt
                  }),
                ],
              }),

              // QR Code (if approved)
              ...(isApproved && qrCodeBase64
                ? [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: Buffer.from(qrCodeBase64, "base64"),
                          transformation: {
                            width: 50,
                            height: 50,
                          },
                          type: "png",
                        }),
                      ],
                      alignment: AlignmentType.RIGHT,
                      spacing: { before: 400 },
                    }),
                    trackingUrl
                      ? new Paragraph({
                          children: [
                            new ExternalHyperlink({
                              children: [
                                new TextRun({
                                  text: "Tracking: " + trackingUrl,
                                  style: "Hyperlink",
                                }),
                              ],
                              link: trackingUrl,
                            }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        })
                      : new Paragraph({ text: "" }),
                  ]
                : []),
            ],
          },
        ],
      });

      // Generate and download the document
      const blob = await Packer.toBlob(doc);
      const fileName = `Surat_Pengantar_${mergedData?.nomor_surat?.replace(/[^a-zA-Z0-9]/g, "_") || "AK15"}_${new Date().getTime()}.docx`;
      saveAs(blob, fileName);

      // Success notification could be added here
      // console.log('Document generated successfully:', fileName);
    } catch (error) {
      console.error("Error generating document:", error);
      // Enhanced error handling - you might want to show a notification here
      alert("Terjadi kesalahan saat membuat dokumen. Silakan coba lagi.");
    }
  };

  return (
    <div>
      <Button
        icon={<DownloadOutlined />}
        style={{ minWidth: 130 }}
        onClick={generateDocument}
      >
        Download DOCX (untuk Revisi)
      </Button>
    </div>
  );
};

export default DownloadDOCXSuratPengantarAK15;
