import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { TembusanDetail } from "@/services/tembusan.service";
import {
  suratTugasTemplate,
  type SuratTugasData,
  type SignatureBlock,
} from "@/lib/templates/surat-tugas";
import {
  suratTugasTableTemplate,
  type SuratTugasTableData,
} from "@/lib/templates/surat-tugas-table";
import {
  suratKeputusanTemplate,
  type SuratKeputusanData,
} from "@/lib/templates/surat-keputusan";

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function buildHtmlFromTemplate(detail: TembusanDetail): string | null {
  try {
    const signatureBlocks: SignatureBlock[] = (detail.signaturesFull || []).map(
      (sig) => ({
        signerRole: sig.signerRole,
        signerName: sig.signerName,
        signerNip: sig.signerNip || undefined,
        signatureUrl: sig.signatureUrl || undefined,
        prefix: sig.prefix || undefined,
        signedAt: sig.signedAt || undefined,
      })
    );

    const stempelUrl = detail.sealImageUrl ? "/stempel.png" : undefined;
    const qrCodeDataUrl = detail.qrCodeUrl || undefined;
    const tembusan = detail.tembusanList || [];
    const content = detail.content || {};
    const submissionValues = detail.submissionValues || {};

    switch (detail.documentType) {
      case "SURAT_TUGAS": {
        const data: SuratTugasData = {
          jenisSurat: "tugas",
          jenisSuratText: (content.jenisSuratText as string) || "SURAT TUGAS",
          nomorSurat: detail.nomorSurat || "-",
          namaLengkap:
            (content.namaLengkap as string) ||
            (submissionValues.nama as string) ||
            "",
          nimNip:
            (content.nimNip as string) ||
            (submissionValues.nim as string) ||
            (submissionValues.nip as string) ||
            "",
          programStudi:
            (content.programStudi as string) ||
            (submissionValues.programStudi as string) ||
            "",
          keperluan:
            (content.keperluan as string) ||
            (submissionValues.keperluan as string) ||
            "",
          judulSurat: (content.judulSurat as string) || detail.perihal || "",
          tanggalSurat: detail.tanggalSurat
            ? formatDate(detail.tanggalSurat)
            : undefined,
          signatures: signatureBlocks,
          stempelUrl,
          qrCodeDataUrl,
          tembusan,
        };
        return suratTugasTemplate(data);
      }

      case "SURAT_TUGAS_TABEL": {
        const pelaksana =
          (content.pelaksana as Array<Record<string, string>>) ||
          (content.dataMahasiswa as Array<Record<string, string>>) ||
          [];
        const customColumns =
          (content.customColumns as Array<{ key: string; label: string }>) ||
          [];

        const dataMahasiswa = pelaksana.map((p) => ({
          nama: p.nama || "",
          nim: p.nim || "",
          prodi: p.prodi || "",
          ...customColumns.reduce(
            (acc, col) => ({ ...acc, [col.key]: p[col.key] || "" }),
            {}
          ),
        }));

        const data: SuratTugasTableData = {
          nomorSurat: detail.nomorSurat || "-",
          dataMahasiswa,
          keterangan:
            (content.keperluan as string) ||
            (content.keterangan as string) ||
            "",
          tanggalMulai: (content.tanggalMulai as string) || "",
          tanggalSelesai: (content.tanggalSelesai as string) || "",
          tanggalSurat: detail.tanggalSurat
            ? formatDate(detail.tanggalSurat)
            : undefined,
          signatures: signatureBlocks,
          stempelUrl,
          qrCodeDataUrl,
          tembusan,
          customColumns,
        };
        return suratTugasTableTemplate(data);
      }

      case "SURAT_KEPUTUSAN": {
        const data: SuratKeputusanData = {
          nomorSurat: detail.nomorSurat || "-",
          tentang: (content.tentang as string) || detail.perihal || "",
          menimbang: (content.menimbang as string[]) || [],
          mengingat: (content.mengingat as string[]) || [],
          menetapkan: (content.menetapkan as string) || "",
          keputusan:
            (content.keputusan as Array<{
              label: string;
              content: string;
            }>) || [],
          tanggalDitetapkan: detail.tanggalSurat
            ? formatDate(detail.tanggalSurat)
            : (content.tanggalDitetapkan as string) || "",
          lampiran: (content.lampiran as boolean) || false,
          dataPeserta:
            (content.dataPeserta as Array<{ nama: string; nim: string }>) ||
            undefined,
          signatures: signatureBlocks,
          stempelUrl,
          qrCodeDataUrl,
          tembusan,
        };
        return suratKeputusanTemplate(data);
      }

      default:
        return null;
    }
  } catch (error) {
    console.error("Error building HTML from template:", error);
    return null;
  }
}

export async function generatePdfBlobFromHtml(
  htmlContent: string
): Promise<Blob> {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 210mm; min-height: 297mm; border: none; z-index: -1;
  `;
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) throw new Error("Could not access iframe document");

    doc.open();
    doc.write(htmlContent);
    doc.close();

    const qrElements = doc.querySelectorAll(".qr-running");
    qrElements.forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    await new Promise<void>((resolve) => {
      const checkImages = () => {
        const images = doc.images;
        let loaded = true;
        for (let i = 0; i < images.length; i++) {
          if (!images[i].complete) { loaded = false; break; }
        }
        if (loaded) resolve();
        else setTimeout(checkImages, 100);
      };
      if (doc.readyState === "complete") checkImages();
      else iframe.onload = checkImages;
    });

    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2canvas(doc.body, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: "#ffffff", width: 794, windowWidth: 794,
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const bottomMargin = 30;
    const usableHeight = pageHeight - bottomMargin;
    const pxPerMm = canvas.width / imgWidth;
    const lineHeightPx = Math.floor(16 * (canvas.width / 210 / 3.78));

    const findSafeBreakPoint = (targetY: number, searchRange = 50): number => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return targetY;
      for (let y = targetY; y > targetY - searchRange && y > 0; y--) {
        const imageData = ctx.getImageData(20, y, canvas.width - 40, 1);
        const data = imageData.data;
        let whitePixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250) whitePixels++;
        }
        if (whitePixels / (data.length / 4) > 0.95) return y;
      }
      return targetY;
    };

    const hasSignificantContent = (fromY: number): boolean => {
      if (fromY >= canvas.height) return false;
      const ctx = canvas.getContext("2d");
      if (!ctx) return true;
      const checkHeight = Math.min(100, canvas.height - fromY);
      const imageData = ctx.getImageData(0, fromY, canvas.width, checkHeight);
      const data = imageData.data;
      let nonWhitePixels = 0;
      const totalPixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) nonWhitePixels++;
      }
      return nonWhitePixels / totalPixels > 0.005;
    };

    const pdf = new jsPDF("p", "mm", "a4");
    const totalHeight = canvas.height;
    let currentY = 0;
    let pageNum = 0;

    while (currentY < totalHeight) {
      const pageUsableHeightMm = pageNum === 0 ? usableHeight : usableHeight - 15;
      const pageUsableHeightPx = Math.floor(pageUsableHeightMm * pxPerMm);
      const remainingHeight = totalHeight - currentY;

      if (pageNum > 0) {
        if (remainingHeight < 50 || !hasSignificantContent(currentY)) break;
        pdf.addPage();
      }

      const targetEndY = currentY + pageUsableHeightPx;
      const safeEndY = targetEndY >= totalHeight
        ? totalHeight
        : findSafeBreakPoint(targetEndY, lineHeightPx * 3);
      const sliceHeight = safeEndY - currentY;
      if (sliceHeight <= 0) break;

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, currentY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        const sliceImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
        const sliceImgHeight = (sliceHeight / canvas.width) * imgWidth;
        const topMargin = pageNum > 0 ? 15 : 0;
        pdf.addImage(sliceImgData, "JPEG", 0, topMargin, imgWidth, sliceImgHeight);

        const qrSize = 18;
        const qrX = 210 - 20 - qrSize;
        const qrY = 297 - 25;
        const qrImgElement = doc.querySelector(".qr-running img") as HTMLImageElement;
        if (qrImgElement && qrImgElement.src) {
          try { pdf.addImage(qrImgElement.src, "PNG", qrX, qrY, qrSize, qrSize); }
          catch (e) { console.warn("Failed to add QR code to page", e); }
        }
      }

      currentY = safeEndY;
      pageNum++;
      if (pageNum > 50) break;
    }

    return pdf.output("blob");
  } finally {
    document.body.removeChild(iframe);
  }
}
