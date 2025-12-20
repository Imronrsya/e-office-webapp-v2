// @ts-nocheck
import React, { useMemo, useState, useEffect } from "react";
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
import { AxiosService } from "@/utils/axios";

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
    width: "70%",
    alignItems: "center",
    marginBottom: -10,
  },
  column: {
    flex: 1,
    margin: 5,
  },
  logo: {
    width: 85,
    height: 80,
    marginRight: 1,
  },
  headerTextSmall: {
    fontSize: 7,
    textAlign: "right",
  },
  headerTextLine1: {
    fontSize: 11,
    textAlign: "left",
    fontWeight: "bold",
    color: "#2F5496",
    marginBottom: 0,
    lineHeight: 1.1,
  },
  headerTextLine2: {
    fontSize: 11,
    textAlign: "left",
    fontWeight: "bold",
    color: "#2F5496",
    marginBottom: 2,
    lineHeight: 1.1,
  },
  headerTextLine3: {
    fontSize: 13,
    textAlign: "left",
    fontWeight: "bold",
    color: "#2F5496",
    marginBottom: 0,
    lineHeight: 1.1,
  },
  headerTextLine4: {
    fontSize: 12,
    textAlign: "left",
    fontWeight: "bold",
    color: "#2F5496",
    marginBottom: 0,
    lineHeight: 1.1,
  },
  page: {
    padding: "25pt 20pt 36pt 9pt",
    fontFamily: "Times-Roman",
    fontSize: 11,
  },
  headerInfo: {
    flexDirection: "row",
    marginLeft: "80pt",
    marginBottom: 2,
    fontSize: 8,
  },
  ak007Box: {
    position: "absolute",
    right: 20,
    top: 117.5,
    border: "2pt solid black",
    padding: 6,
    width: 80,
    textAlign: "center",
  },
  ak007Text: {
    fontSize: 14,
    fontWeight: "bold",
  },
  suratTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 15,
    textDecoration: "underline",
  },
  nomorSurat: {
    textAlign: "center",
    fontSize: 12,
    marginBottom: 15,
  },
  contentSection: {
    marginLeft: "80pt",
    marginRight: "32.85pt",
    lineHeight: 1.6,
    textAlign: "justify",
  },
  dataTable: {
    marginTop: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  labelColumn: {
    width: 150,
  },
  colonColumn: {
    width: 10,
  },
  valueColumn: {
    flex: 1,
  },
  underline: {
    textDecoration: "underline",
  },
  qrCode: {
    position: "absolute",
    right: 250,
    bottom: 270,
    width: 80,
    height: 80,
  },
  placeholderSignature: {
    width: 200,
    height: 80,
    borderWidth: 1,
    borderColor: "gray",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  placeholderText: {
    fontSize: 12,
    color: "gray",
    fontStyle: "italic",
  },
});

// QR Code component
const QR = ({
  url,
  level = "H",
  width = 80,
  foreground = "#000",
  background = "#fff",
}: QRProps): JSX.Element => {
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

// Helper function to check if surat has been approved and should show QR
const isDocumentApproved = (progress) => {
  return progress?.some(
    (p) =>
      (p.role?.nama?.toLowerCase().includes("manajer tu") ||
        p.role?.id === 27) &&
      p.status === "DISETUJUI_MANAJER_TU",
  );
};

const isDocumentApprovedUPA = (progress) => {
  // console.log("Progress data for UPA check:", progress);
  return progress?.some((p) => {
    // console.log("Progress item:", p);
    return p.roleId === 10 && p.status === "PENOMORAN";
  });
};

// Helper function to format date
const formatTanggal = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Helper function to calculate academic year and semester
const calculateAcademicInfo = (nim) => {
  if (!nim)
    return {
      tahunMasuk: "000",
      tahunAkademikSekarang: "0000/0000",
      semester: 0,
    };

  const tahunMasuk = "20" + nim.substring(6, 8);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  let tahunAkademikMulai, tahunAkademikAkhir;
  if (currentMonth >= 8) {
    tahunAkademikMulai = currentYear;
    tahunAkademikAkhir = currentYear + 1;
  } else {
    tahunAkademikMulai = currentYear - 1;
    tahunAkademikAkhir = currentYear;
  }

  const tahunAkademikSekarang = `${tahunAkademikMulai}/${tahunAkademikAkhir}`;
  const yearsDiff = currentYear - parseInt(tahunMasuk);
  let semester;
  if (currentMonth >= 8) {
    semester = yearsDiff * 2 + 1;
  } else {
    semester = yearsDiff * 2;
  }
  semester = Math.min(Math.max(semester, 1), 12);

  return {
    tahunMasuk,
    tahunAkademikSekarang,
    semester,
  };
};

// Main document component for AK007
const SuratKeteranganAK007 = ({
  formData = {},
  dataTambahan = {},
  currentUserRole = {},
}) => {
  // console.log("Form Data:", formData);
  // console.log("Data Tambahan:", dataTambahan);
  // console.log("Current user role:", currentUserRole);
  const [ttdMTU, setTtdMTU] = useState("");
  const [idencrypt, setIDEncrypt] = useState<string>("");

  const isApproved = isDocumentApproved(formData?.Progress);
  const isApprovedUPA = isDocumentApprovedUPA(formData?.Progress);
  // console.log("PROGRESS", formData?.Progress);

  // Parse mahasiswa data from surat_masuk information
  let mahasiswaData = {};
  try {
    mahasiswaData = JSON.parse(formData?.surat_masuk?.information || "{}");
  } catch (error) {
    console.error("Error parsing mahasiswa data:", error);
  }

  const academicInfo = calculateAcademicInfo(mahasiswaData.nim);

  // Encryption functions (same as SPPTA)
  function toBase64(arr: Uint8Array): string {
    return btoa(String.fromCharCode(...arr));
  }

  const encryptAES = async (text: string) => {
    const subtle = window.crypto.subtle;
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
  };

  // Get TTD from API (same pattern as SPPTA)
  const getTTDFromAPI = async () => {
    try {
      const axios = new AxiosService();
      // if (currentUserRole == 8) {

      // }
      // 1. Cek user yang login (asumsi ada di context atau props)
      const currentUser = await axios.get(`/v1/pegawai/${8}`); // atau dari props/context
      // console.log("Current User:", currentUser);
      const allData = await axios.get(
        `/v1/pegawai/allData/${currentUser?.data?.data?.[0].Pegawai?.uuid}`,
      );
      // console.log("allData", allData);
      const signatureFileName =
        allData?.data?.data?.user?.TandaTangan?.[0].signature_url;
      setTtdMTU(`${process.env.UMI_APP_PUBLIC_API_URL}/v2/ttd?filename=${signatureFileName}`);
    } catch (error) {
      console.error("Error fetching TTD:", error);
    }
  };

  useEffect(() => {
    // console.log("=== QR CODE DEBUG ===");
    // console.log("formData:", formData);
    // console.log("surat_masuk ID:", formData?.surat_masuk?.id);
    // console.log("isApproved:", isApproved);

    if (isApproved && formData?.surat_masuk?.id) {
      // console.log("Encrypting ID:", formData.surat_masuk.id.toString());
      getTTDFromAPI();
      encryptAES(formData.surat_masuk.id.toString());
    }
  }, [isApproved, formData]);

  // Generate tracking URL with encryption
  // console.log("idencrypt", idencrypt);
  let trackingUrl = "";
  if (isApproved && idencrypt) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const PUBLIC_BASE = "/persuratan-mahasiswa";
    trackingUrl = `${origin}${PUBLIC_BASE}/tracking/${idencrypt}`;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* AK.007 Box */}
        <View style={styles.ak007Box}>
          <Text style={styles.ak007Text}>AK.007</Text>
        </View>

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.combineLogoHeader}>
            <Image style={styles.logo} src={logo} />
            <View style={styles.column}>
              <Text style={[styles.headerTextLine1]}>
                KEMENTERIAN PENDIDIKAN TINGGI, SAINS,
              </Text>
              <Text style={[styles.headerTextLine2]}>DAN TEKNOLOGI</Text>
              <Text style={[styles.headerTextLine3]}>
                UNIVERSITAS DIPONEGORO
              </Text>
              <Text style={[styles.headerTextLine4]}>
                FAKULTAS SAINS DAN MATEMATIKA
              </Text>
            </View>
          </View>
          <View
            style={{
              flex: 1,
              alignItems: "flex-end",
              justifyContent: "center",
              marginTop: 7,
            }}
          >
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

        {/* Document Title */}
        <Text style={styles.suratTitle}>SURAT PERNYATAAN MASIH KULIAH</Text>
        <Text style={styles.nomorSurat}>
          Nomor:{" "}
          {formData?.nomor_surat ||
            `......../UN7.F8.4/AK/.../${new Date().getFullYear()}`}
        </Text>

        {/* Document Content */}
        <View style={styles.contentSection}>
          <Text style={{ marginBottom: -5, marginTop: 35 }}>
            Dekan Fakultas Sains dan Matematika Universitas Diponegoro
            menerangkan bahwa:
          </Text>

          {/* Penandatangan Info */}
          <View style={styles.dataTable}>
            <View style={styles.tableRow}>
              <Text style={styles.labelColumn}>Nama</Text>
              <Text style={styles.colonColumn}>:</Text>
              <Text style={styles.valueColumn}>
                {mahasiswaData.nama || "NAMA MAHASISWA"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.labelColumn}>Tempat / Tanggal Lahir</Text>
              <Text style={styles.colonColumn}>:</Text>
              <Text style={styles.valueColumn}>
                {mahasiswaData.ttl || "Tempat / Tanggal Lahir"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.labelColumn}>Alamat</Text>
              <Text style={styles.colonColumn}>:</Text>
              <Text style={styles.valueColumn}>
                {mahasiswaData.alamat || "ALAMAT"}
              </Text>
            </View>
          </View>

          <Text style={{ marginTop: 5, marginBottom: -5 }}>
            pada tahun akademik {academicInfo.tahunMasuk} /{" "}
            {parseInt(academicInfo.tahunMasuk) + 1} terdaftar sebagai mahasiswa
            Fakultas Sains dan Matematika (FSM) Universitas Diponegoro.
          </Text>

          {/* Academic Info */}
          <View style={styles.dataTable}>
            <View style={styles.tableRow}>
              <Text style={styles.labelColumn}>Departemen/Prodi/Jenjang</Text>
              <Text style={styles.colonColumn}>:</Text>
              <Text style={styles.valueColumn}>
                {mahasiswaData.program_studi ||
                  "PRODI / DEPARTEMEN / UNIVERSITAS"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.labelColumn}>NIM</Text>
              <Text style={styles.colonColumn}>:</Text>
              <Text style={styles.valueColumn}>
                {mahasiswaData.nim || "NIM"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.labelColumn}>Semester</Text>
              <Text style={styles.colonColumn}>:</Text>
              <Text style={styles.valueColumn}>{academicInfo.semester}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.labelColumn}>
                Keterangan ini diberikan untuk
              </Text>
              <Text style={styles.colonColumn}>:</Text>
              <Text style={styles.valueColumn}>
                {mahasiswaData.keperluan || "KETERANGAN"}
              </Text>
            </View>
          </View>
        </View>

        {/* Date and Signature */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: 20,
            marginRight: 40,
          }}
        >
          <View>
            <Text>
              Semarang,{" "}
              {formatTanggal(formData?.tanggal_surat) || "27 September 2025"}
            </Text>
            <Text>a.n. Dekan,</Text>
            <Text>Wakil Dekan 1</Text>
            <Text>u.b. Manajer Bagian Tata Usaha</Text>

            {isApproved ? (
              <>
                {ttdMTU ? (
                  <Image
                    src={ttdMTU}
                    style={{
                      width: 70,
                      height: 50,
                      marginVertical: 10,
                    }}
                  />
                ) : (
                  <View style={styles.placeholderSignature}>
                    <Text style={styles.placeholderText}>
                      [Tanda Tangan Digital MTU]
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View>
                <Text>{"\n\n\n\n\n\n"}</Text>
              </View>
            )}

            <Text style={styles.underline}>Lilik Maryuni, S.E., M.Si.</Text>
            <Text>NIP. 197808042001122001</Text>
          </View>
        </View>

        {/* QR Code with encrypted tracking URL */}
        {isApprovedUPA && trackingUrl && <QR url={trackingUrl} width={80} />}
      </Page>
    </Document>
  );
};

export default SuratKeteranganAK007;
