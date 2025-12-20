import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import logo from "@/persuratan-mahasiswa/images/logo_undip.png";

//  Create styles
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
    width: 60,
    height: 60,
    marginBottom: 10,
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
    marginBottom: 20,
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
  hoverText: {
    top: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "white",
    padding: 5,
    borderRadius: 5,
  },
});

const HTMLToPDFParser = (htmlContent: string) => {
  const parseNode = (): React.ReactNode => {
    // Create parser and parse HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const elements = Array.from(doc.body.children);

    // console.log("Starting HTML parsing");

    return elements.map((element, index) => {
      // console.log("Processing element:", element.tagName);

      switch (element.tagName.toLowerCase()) {
        case "p":
          return (
            <View
              key={index}
              style={{
                marginLeft: "49.65pt",
                textAlign: "justify",
              }}
            >
              {element.childNodes[0].nodeName === "strong" ? (
                <Text key={`${index}-strong`} style={{ fontWeight: "bold" }}>
                  {element.textContent}
                </Text>
              ) : (
                <Text key={`${index}-normal`}>{element.textContent}</Text>
              )}
            </View>
          );

        case "br":
          return <Text key={index}>{"\n"}</Text>;

        case "strong":
          return (
            <Text key={index} style={{ fontWeight: "bold" }}>
              {element.textContent}
            </Text>
          );

        // Handle div similar to paragraphs
        case "div":
          return (
            <View key={index} style={{ marginBottom: 5 }}>
              <Text>{element.textContent}</Text>
            </View>
          );

        // Default case for other elements
        default:
          // console.log("Unhandled element type:", element.tagName);
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
  return progress?.some(
    (p) => p.role.nama === "dekan" && p.status === "DISETUJUI",
  );
};

// Create Document Component
const SuratKeteranganAK8 = ({ formData = {}, dataTambahan = {} }) => {
  // console.log(formData?.Progress)
  const isApproved = hasWakilDekanApproval(formData?.Progress);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.combineLogoHeader}>
            <Image
              style={styles.logo}
              src={logo} // Replace with the path to your logo image
            />
            <View style={styles.column}>
              <Text style={styles.headerText}>
                KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
              </Text>
              <Text style={styles.headerText}>UNIVERSITAS DIPONEGORO</Text>
              <Text style={styles.headerText}>
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
        <Text style={{ textAlign: "right" }}>
          {new Date(formData?.tanggal_surat).toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          })}
        </Text>

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

        <View style={{ marginBottom: 24 }}>
          {formData?.tujuan_surat && HTMLToPDFParser(formData.tujuan_surat)}
        </View>
        <View>
          {formData?.isi_surat && HTMLToPDFParser(formData.isi_surat)}
        </View>

        <View style={styles.signature}>
          <Text>Dekan</Text>
          {isApproved ? (
            <>
              <Text>{"\n\n"}</Text>
              <Image
                source={require("./signature-wd1.png")}
                style={styles.signatureImage}
              />
            </>
          ) : (
            <Text>{"\n\n"}</Text>
          )}
          <Text>{"\n\n"}</Text>
          <Text style={styles.underline}>
            Prof. Dr. Kusworo Adi, S.Si., M.T.
          </Text>
          <Text>NIP. 197203171998021001</Text>
        </View>

        <View style={styles.footer}>
          <Text>Tembusan:</Text>
          <Text>{formData?.tembusan?.join("\n")}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default SuratKeteranganAK8;
