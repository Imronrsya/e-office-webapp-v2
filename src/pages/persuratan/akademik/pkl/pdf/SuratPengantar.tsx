// @ts-nocheck
import React, { useMemo, useEffect, useState } from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Svg,
  Rect,
  Font,
} from "@react-pdf/renderer";
import logo from "@/images/logo_undip.png";
import { getMatrix } from "qr-code-generator-lib";
import HTMLToPDFParser from "@/helper/HTMLParser";

Font.registerHyphenationCallback((word) => [word]);

// QR Code interfaces and enums
interface QRProps {
  url: string;
  level?: keyof typeof EcLevels;
  width?: number;
  foreground?: string;
  background?: string;
}

enum EcLevels {
  L = 0,
  M = 1,
  Q = 2,
  H = 3,
}

const styles = StyleSheet.create({
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  combineLogoHeader: {
    display: "flex",
    flexDirection: "row",
    width: "60%",
  },
  column: {
    flex: 1,
    margin: 5,
  },
  logo: {
    width: 70,
    height: 70,
  },
  headerTextSmall: {
    fontSize: 7,
    textAlign: "right",
  },
  headerText: {
    fontSize: 12,
    textAlign: "left",
    marginBottom: 2,
  },
  page: {
    padding: "58.85pt 55.35pt 36pt 36pt",
    fontFamily: "Times-Roman",
    fontSize: 12,
  },
  dateContainer: {
    marginBottom: 20,
    alignItems: "flex-end",
  },
  headerInfo: {
    flexDirection: "row",
    marginLeft: "49.65pt",
  },
  recipient: {
    marginLeft: "49.65pt",
    marginBottom: 24,
    lineHeight: 1.5,
  },
  recipientLine: {
    marginBottom: 8,
  },
  contentBody: {
    marginRight: "32.85pt",
    marginLeft: "49.65pt",
    textAlign: "justify",
    lineHeight: 1.5,
  },
  studentInfo: {
    marginLeft: "49.65pt",
    marginTop: 20,
    marginBottom: 20,
  },
  signature: {
    marginTop: 40,
    marginLeft: "270.7pt",
    position: "relative",
  },
  signatureImage: {
    width: 150,
    height: 80,
    marginVertical: 10,
    top: 30,
    position: "absolute",
  },
  footer: {
    marginTop: 20,
    marginLeft: "49.5pt",
  },
  underline: {
    textDecoration: "underline",
  },
  label: {
    width: 60,
  },
  colon: {
    width: 5,
  },
  value: {
    flex: 1,
  },
  qrCode: {
    position: "absolute",
    right: 80,
    bottom: 70,
    width: 50,
    height: 50,
  },
});

// QR Code component
const QR = ({
  url,
  level = "H",
  width = 64,
  foreground = "#000",
  background = "#fff",
}: QRProps): JSX.Element => {
  // EcLevels seems to not do anything...
  // @ts-expect-error qr-code-generator-lib-misstype
  const matrix = useMemo(() => getMatrix(url), EcLevels[level], [url, level]);
  const factor = useMemo(() => width / matrix.length, [matrix, width]);

  return (
    <Svg
      style={styles.qrCode}
      width={width}
      height={width}
      viewBox={`0 0 ${width} ${width}`}
    >
      {matrix.map((row, x) =>
        row.map((cell, y) => (
          <Rect
            key={`${x}-${y}`}
            x={x * factor}
            y={y * factor}
            width={1 * factor}
            height={1 * factor}
            fill={cell ? foreground : background}
          />
        )),
      )}
    </Svg>
  );
};

// Helper function to check if Wakil Dekan has approved
const hasWakilDekanApproval = (progress) => {
  return progress?.some(
    (p) => p.role.nama === "wakil dekan 1" && p.status === "DISETUJUI",
  );
};

// Main document component
const SuratPengantarAK15 = ({ formData = {}, dataTambahan = {} }) => {
  const isApproved = hasWakilDekanApproval(formData?.Progress);
  const [idencrypt, setIDEncrypt] = useState<string>("");

  // AES encrypt helper
  function toBase64(arr: Uint8Array): string {
    return btoa(String.fromCharCode(...arr));
  }
  const encryptAES = async (text: string) => {
    try {
      const subtle = window.crypto?.subtle;
      if (!subtle) return;
      const keyString = "apps-persuratan!";
      const keyBuffer = new TextEncoder().encode(keyString.padEnd(32, "0"));
      const iv = window.crypto.getRandomValues(new Uint8Array(16));
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
      setIDEncrypt(`${safeCiphertext}-${safeIvBase64}`);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (isApproved && formData?.surat_masuk?.id) {
      encryptAES(String(formData.surat_masuk.id));
    }
  }, [isApproved, formData?.surat_masuk?.id]);

  const PUBLIC_BASE = "/persuratan-mahasiswa";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const trackingUrl =
    isApproved && idencrypt
      ? `${origin}${PUBLIC_BASE}/tracking/${idencrypt}`
      : "";

  // console.log('tujuan surat', formData?.tujuan_surat)
  // console.log('isi surat', formData?.isi_surat)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.combineLogoHeader}>
            <Image style={styles.logo} src={logo} />
            <View style={styles.column}>
              <Text style={[styles.headerText, { fontSize: 10 }]}>
                KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
              </Text>
              <Text style={[styles.headerText, { fontSize: 14 }]}>
                UNIVERSITAS DIPONEGORO
              </Text>
              <Text style={[styles.headerText, { fontSize: 12 }]}>
                FAKULTAS SAINS DAN MATEMATIKA
              </Text>
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.headerTextSmall}>Jalan Prof. Jacub Rais</Text>
            <Text style={styles.headerTextSmall}>
              Kampus Universitas Diponegoro
            </Text>
            <Text style={styles.headerTextSmall}>
              Tembalang, Semarang, Kode Pos 50275
            </Text>
            <Text style={styles.headerTextSmall}>
              Telp (024) 7474754 Fax (024) 76480690
            </Text>
            <Text style={styles.headerTextSmall}>
              Laman: www.fsm.undip.ac.id
            </Text>
            <Text style={styles.headerTextSmall}>Pos-el: fsm@undip.ac.id</Text>
          </View>
        </View>

        {/* Date */}
        <Text style={{ textAlign: "right" }}>
          {formData?.tanggal_surat &&
            new Date(formData.tanggal_surat).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
        </Text>

        {/* Letter Header Info */}
        <View style={{ marginBottom: 24 }}>
          <View style={styles.headerInfo}>
            <Text style={styles.label}>Nomor</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{formData?.nomor_surat}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.label}>Lampiran</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{formData?.lampiran}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.label}>Hal.</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{formData?.hal}</Text>
          </View>
        </View>

        {/* Recipient */}
        <View style={{ marginBottom: 24 }}>
          {formData?.tujuan_surat && HTMLToPDFParser(formData.tujuan_surat)}
        </View>

        {/* Letter Content - BACK TO HTMLToPDFParser dengan left alignment */}
        <View>
          {formData?.isi_surat && HTMLToPDFParser(formData.isi_surat)}
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <Text>a.n. Dekan,</Text>
          <Text>Wakil Dekan Akademik dan Kemahasiswaan,</Text>
          {isApproved ? (
            <>
              <Text>{"\n\n\n\n"}</Text>
              <Image
                source={require("./signature-wd1.png")}
                style={styles.signatureImage}
              />
            </>
          ) : (
            <Text>{"\n\n"}</Text>
          )}
          <Text>{"\n\n"}</Text>
          <Text style={styles.underline}>Dr. Ngadiwiyana, S.Si., M.Si.</Text>
          <Text>NIP. 196906201999031002</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Tembusan:</Text>
          <Text>{formData?.tembusan?.join("\n")}</Text>
        </View>

        {/* QR Code */}
        {isApproved && trackingUrl && <QR url={trackingUrl} />}
      </Page>
    </Document>
  );
};

export default SuratPengantarAK15;
