import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Create styles - Fixed style properties
const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 11,
  },
  header: {
    marginBottom: 15,
  },
  title: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 10,
  },
  addressee: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 115,
  },
  colon: {
    width: 10,
  },
  value: {
    flex: 1,
  },
  sksIpkRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  box: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000000",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    paddingRight: 4,
    width: 60,
    marginRight: 20,
  },
  signature: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureColumn: {
    width: "45%",
  },
  signatureName: {
    marginTop: 60,
    fontSize: 11,
  },
  nip: {
    fontSize: 11,
  },
  text: {
    marginBottom: 10,
  },
  spacedText: {
    marginTop: 15,
    marginBottom: 5,
  },
  additionalSignature: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const AK8 = ({ formData = {} }) => {
  // console.log(formData)
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Surat Keterangan Lulus {formData?.skl}
          </Text>
        </View>

        {/* Addressee */}
        <View style={styles.addressee}>
          <Text>Yth. Dekan</Text>
          <Text>Fakultas Sains dan Matematika</Text>
          <Text>Universitas Diponegoro Semarang.</Text>
        </View>

        {/* Form Content */}
        <Text style={styles.text}>
          Dengan ini kami mengajukan pemohonan penerbitan Surat Keterangan Lulus
          atas nama :
        </Text>

        {/* Data Mahasiswa */}
        <View style={styles.formRow}>
          <Text style={styles.label}>Nama</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.nama || ""}</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>NIM</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.nim || ""}</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>Tempat/Tanggal Lahir</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.tempat_lahir || ""}</Text>
          <Text style={styles.value}>{formData?.tanggal_lahir || ""}</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>Alamat</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.alamat || ""}</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>No telp/HP</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.kontak || ""}</Text>
        </View>

        {/* Surat keterangan */}
        <Text style={styles.spacedText}>
          Telah dinyatakan lulus ujian Sarjana pada Departemen/Program Studi{" "}
          {formData?.departemen || ""}/S1 Fakultas Sains dan Matematika
          Universitas Diponegoro pada tanggal {formData?.tanggal_lulus || ""}{" "}
          dengan Indeks Prestasi Kumulatif (IPK) {formData?.ipk || ""} dengan
          Jumlah Satuan Kredit Semester (SKS) 144.
        </Text>

        <Text style={styles.spacedText}>Berikut kami lampirkan :</Text>

        <View style={styles.formRow}>
          <Text style={{ width: 500 }}>- Foto Copy Kartu Mahasiswa (KTM)</Text>
        </View>
        <View style={styles.formRow}>
          <Text style={{ width: 500 }}>
            - Pas Photo hitam putih /berwarna uk 4 x 6 sebanyak 2 lembar
          </Text>
        </View>
        <View style={styles.formRow}>
          <Text style={{ width: 500 }}>- Foto Copy Berita Acara Kelulusan</Text>
        </View>
        <View style={styles.formRow}>
          <Text style={{ width: 500 }}>
            - Foto Copy Berita Acara Ujian Sarjana
          </Text>
        </View>
        <View style={styles.formRow}>
          <Text style={{ width: 500 }}>
            - Daftar Prestasi Akademik yang ditandatangani Dekan
          </Text>
        </View>

        <Text style={styles.spacedText}>
          Demikian surat permohonan kami, atas perhatiannya kami sampaikan
          terimakasih.
        </Text>

        {/* Signatures */}
        <View style={styles.signature}>
          <View style={styles.signatureColumn}>
            <Text>Mengetahui</Text>
            <Text>Ketua Departemen</Text>
            <Text style={styles.signatureName}>
              {formData?.nama_ketua_departemen}
            </Text>
            <Text style={styles.nip}>
              NIP. {formData?.nip_ketua_departemen}
            </Text>
          </View>
          <View style={styles.signatureColumn}>
            <Text>
              Semarang,{" "}
              {formData?.tanggal
                ? new Date(formData.tanggal).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : ""}
            </Text>
            <Text>Pemohon,</Text>
            <Text style={styles.signatureName}>{formData?.nama || ""}</Text>
            <Text style={styles.nip}>NIM. {formData?.nim || ""}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default AK8;
