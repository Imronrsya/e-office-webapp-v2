// @ts-nocheck
import React, { useMemo, useEffect, useState } from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Svg, Rect } from '@react-pdf/renderer';
import logo from '@/images/logo_undip.png';
import { getMatrix } from "qr-code-generator-lib";

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

// Create styles
const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingBottom: 5,
  },
  // Remove the headerLine style since we don't want that border anymore
  combineLogoHeader: {
    display: 'flex',
    flexDirection: 'row',
    width: '60%'
  },
  column: {
    flex: 1,
    margin: 5,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  headerTextSmall: {
    fontSize: 7,
    textAlign: 'right',
    color: '#003f87', // Changed to match the blue color
  },
  headerText: {
    fontSize: 12,
    textAlign: 'left',
    marginBottom: 2,
    color: '#003f87', // Blue color for the header text
    fontFamily: 'Times-Bold',
  },
  page: {
    padding: '45pt 55.35pt 36pt 36pt', // Reduced top padding to fit everything on one page
    fontFamily: 'Times-Roman',
    fontSize: 12,
  },
  dateContainer: {
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  headerInfo: {
    flexDirection: 'row',
    marginLeft: '49.65pt',
  },
  recipient: {
    marginLeft: '49.65pt',
    marginBottom: 20,
  },
  contentBody: {
    marginRight: '32.85pt',
    marginLeft: '49.65pt',
    textAlign: 'justify',
    lineHeight: 1.5,
  },
  studentInfo: {
    marginLeft: '49.65pt',
    marginTop: 15, // Reduced from 20 to 15
    marginBottom: 15, // Reduced from 20 to 15
  },
  signature: {
    marginTop: 30, // Reduced from 40 to 30
    marginLeft: '270.7pt',
    position: 'relative'
  },
  signatureImage: {
    width: 150,
    height: 80,
    marginVertical: 10,
    top: 30,
    position: 'absolute',
  },
  footer: {
    marginTop: 20,
    marginLeft: '49.5pt',
  },
  underline: {
    textDecoration: 'underline',
  },
  label: {
    width: 120,
  },
  colon: {
    width: 5,
  },
  value: {
    flex: 1,
  },
  hoverText: {
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    padding: 5,
    borderRadius: 5,
  },
  qrCode: {
    position: 'absolute',
    right: 80,
    bottom: 70,
    width: 50,
    height: 50,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Times-Bold',
    textDecoration: 'underline', // Added underline here
  },
  documentSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 30, // Reduced from 40 to 30
    fontFamily: 'Times-Roman',
  },
  studentInfoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  studentInfoItem: {
    flexDirection: 'row',
    marginBottom: 6, // Reduced from 8 to 6
    marginLeft: 30,
  },
  explanatoryParagraph: {
    marginTop: 8, // Reduced from 10 to 8
    marginBottom: 15, // Reduced from 20 to 15
    textAlign: 'justify',
    marginLeft: 30,
    marginRight: 30,
  }
});

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
    <Svg style={styles.qrCode} width={width} height={width} viewBox={`0 0 ${width} ${width}`}>
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
        ))
      )}
    </Svg>
  );
};

const HTMLToPDFParser = (htmlContent: string) => {
  const parseNode = (): React.ReactNode => {
    // Create parser and parse HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const elements = Array.from(doc.body.children);

    console.log("Starting HTML parsing");

    return elements.map((element, index) => {
      console.log("Processing element:", element.tagName);

      switch (element.tagName.toLowerCase()) {
        case 'p':
          return (
            <View key={index} style={{
              marginLeft: '49.65pt',
              textAlign: 'justify'
            }}>
              {element.childNodes[0].nodeName === 'strong' ? (
                <Text key={`${index}-strong`} style={{ fontWeight: 'bold' }}>
                  {element.textContent}
                </Text>
              ) : (
                <Text key={`${index}-normal`}>{element.textContent}</Text>
              )}
            </View>
          );

        case 'br':
          return <Text key={index}>{'\n'}</Text>;

        case 'strong':
          return (
            <Text key={index} style={{ fontWeight: 'bold' }}>
              {element.textContent}
            </Text>
          );

        // Handle div similar to paragraphs
        case 'div':
          return (
            <View key={index} style={{ marginBottom: 5 }}>
              <Text>{element.textContent}</Text>
            </View>
          );

        // Default case for other elements
        default:
          console.log("Unhandled element type:", element.tagName);
          return <Text key={index}>{element.textContent}</Text>;
      }
    });
  };

  // Return the parsed content
  try {
    return parseNode();
  } catch (error) {
    console.error("Error parsing HTML:", error);
    return <Text>Error parsing content</Text>;
  }
};

const hasWakilDekanApproval = (progress) => {
  return progress?.some(p =>
    p.role.nama === "wakil dekan 1" &&
    p.status === "DISETUJUI"
  );
};

// Create Document Component
const SuratRekomendasiBeasiswa = ({ formData = {}, dataTambahan = {} }) => {
  const isApproved = hasWakilDekanApproval(formData?.Progress);
  const [idencrypt, setIDEncrypt] = useState<string>("");

  // helpers for AES encryption (same scheme as other templates)
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
      const encryptedData = await subtle.encrypt({ name: "AES-CBC", iv }, cryptoKey, data);
      const ciphertext = toBase64(new Uint8Array(encryptedData));
      const ivBase64 = toBase64(iv);
      const safeCiphertext = ciphertext.replace(/\//g, "sl4shbR0");
      const safeIvBase64 = ivBase64.replace(/\//g, "sl4shbR0");
      setIDEncrypt(`${safeCiphertext}-${safeIvBase64}`);
    } catch (e) {
      // noop - fallback is empty idencrypt which hides QR
    }
  };

  useEffect(() => {
    if (isApproved && formData?.surat_masuk?.id) {
      encryptAES(String(formData.surat_masuk.id));
    }
  }, [isApproved, formData?.surat_masuk?.id]);

  const PUBLIC_BASE = "/persuratan-mahasiswa";
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const trackingUrl = isApproved && idencrypt ? `${origin}${PUBLIC_BASE}/tracking/${idencrypt}` : "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.combineLogoHeader}>
            <Image
              style={styles.logo}
              src={logo}
            />
            <View style={styles.column}>
              <Text style={styles.headerText}>KEMENTERIAN PENDIDIKAN TINGGI,</Text>
              <Text style={styles.headerText}>SAINS, DAN TEKNOLOGI</Text>
              <Text style={styles.headerText}>UNIVERSITAS DIPONEGORO</Text>
              <Text style={styles.headerText}>FAKULTAS SAINS DAN MATEMATIKA</Text>
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.headerTextSmall}>Jalan Prof. Jacub Rais</Text>
            <Text style={styles.headerTextSmall}>Kampus Universitas Diponegoro</Text>
            <Text style={styles.headerTextSmall}>Tembalang, Semarang, Kode Pos 50275</Text>
            <Text style={styles.headerTextSmall}>Telp (024) 7474754 Fax (024) 76480690</Text>
            <Text style={styles.headerTextSmall}>Laman: www.fsm.undip.ac.id</Text>
            <Text style={styles.headerTextSmall}>Pos-el: fsm@undip.ac.id</Text>
          </View>
        </View>

        {/* Removed the horizontal line */}

        {/* Document Title - Bold, Centered, and now Underlined */}
        <View style={{ marginBottom: 20, marginTop: 30 }}>
          <Text style={styles.documentTitle}>S U R A T - R E K O M E N D A S I</Text>
          <Text style={styles.documentSubtitle}>Nomor: {formData?.nomor_surat}</Text>
        </View>

        {/* Custom HTML Content */}
        <View>
          {formData?.isi_surat && HTMLToPDFParser(formData.isi_surat)}
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <Text>a.n. Dekan,</Text>
          <Text>Wakil Dekan Akademik dan Kemahasiswaan,</Text>
          {isApproved ? (
            <>
            <Text>{'\n\n\n'}</Text>
            <Image
              source={require('./signature-wd1.png')}
              style={styles.signatureImage}
            />
            </>
          ) : (
            <Text>{'\n\n'}</Text>
          )}
          <Text>{'\n\n'}</Text>
          <Text style={styles.underline}>Dr. Ngadiwiyana, S.Si., M.Si.</Text>
          <Text>NIP. 196906201999031002</Text>
        </View>
        {isApproved && trackingUrl && (
            <QR url={trackingUrl} />
          )}
      </Page>
    </Document>
  );
}

export default SuratRekomendasiBeasiswa;
