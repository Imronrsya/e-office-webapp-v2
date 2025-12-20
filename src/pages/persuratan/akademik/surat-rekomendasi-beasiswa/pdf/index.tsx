import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

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
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addressee: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  box: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    paddingRight: 4,
    width: 60,
    marginRight: 20,
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureColumn: {
    width: '45%',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const SRB = ({ formData = {} }) => {
  console.log(formData)
  return (

    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Permohonan Surat Pengantar {formData?.pengantar_untuk}

          </Text>
        </View>

        {/* Addressee */}
        <View style={styles.addressee}>
          <Text>Yth. Dekan</Text>
          <Text>Fakultas Sains dan Matematika</Text>
          <Text>Universitas Diponegoro Semarang.</Text>
        </View>

        {/* Form Content */}
        <Text style={styles.text}>Yang bertanda tangan di bawah ini:</Text>

        {/* Personal Information */}
        <View style={styles.formRow}>
          <Text style={styles.label}>Nama</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.nama || ''}</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>NIM</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.nim || ''}</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>Semester</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.semester || ''}</Text>
        </View>

        <View style={styles.sksIpkRow}>
          <Text style={styles.label}>Jumlah</Text>
          <Text style={styles.colon}>:</Text>
          <Text>SKS:</Text>
          <View style={styles.box}>
            <Text>{formData?.sks || ''}</Text>
          </View>
          <Text>IPK:</Text>
          <View style={styles.box}>
            <Text>{formData?.ipk || ''}</Text>
          </View>
        </View>

        {/* Department Information */}
        <View style={styles.formRow}>
          <Text style={styles.label}>Departemen</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>
            {formData?.Departemen || ''} Prodi: {formData?.Prodi || ''} Jenjang: {formData?.jenjang || ''}
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.formRow}>
          <Text style={styles.label}>Alamat</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.Alamat || ''}</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>No telp/HP</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.kontak || ''}</Text>
        </View>

        {/* Internship Details */}
        <Text style={styles.spacedText}>
          dengan ini kami mengajukan permohonan surat pengantar untuk
        </Text>

        <View style={styles.formRow}>
          <Text style={styles.label}>Yang ditujukan kepada</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.tujuan_surat || ''}</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>Jabatan yang dituju</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.jabatan || ''}</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>Nama Instansi</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.instansi || ''}</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>Alamat</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.alamat_instansi || ''}</Text>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>Tema/Judul</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formData?.judul || ''}</Text>
        </View>

        <Text style={styles.spacedText}>
          Sebagai persyaratan bersama ini kami lampirkan :
        </Text>

        <View style={styles.formRow}>
          <Text style={{width:500}}>- Copy KTM yang masih berlaku</Text>
        </View>
        <View style={styles.formRow}>
          <Text style={{width:500}}>- Proposal {formData?.pengatar_untuk}</Text>
        </View>

        <Text style={styles.spacedText}>
          Atas perhatiannya kami sampaikan  terima kasih.
        </Text>

        {/* Signatures */}
        <View style={styles.signature}>
          <View style={styles.signatureColumn}>
            <Text>Mengetahui dan menyetujui</Text>
            <Text>Dosen Pembimbing</Text>
            <Text style={styles.signatureName}>{formData?.nama_dosen_pembimbing}</Text>
            <Text style={styles.nip}>NIP. {formData?.nip_dosen_pembimbing}</Text>
          </View>
          <View style={styles.signatureColumn}>
            <Text>Semarang, {formData?.tanggal ? new Date(formData.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</Text>
            <Text>Hormat saya,</Text>
            <Text style={styles.signatureName}>{formData?.nama || ''}</Text>
            <Text style={styles.nip}>NIM. {formData?.nim || ''}</Text>
          </View>
        </View>

        {/* Additional Signatures */}
        <View style={styles.additionalSignature}>
          <View style={styles.signatureColumn}>
            <Text>Mengetahui & menyetujui,</Text>
            <Text>Ketua Prodi {formData?.Prodi}</Text>
            <Text style={styles.signatureName}>{formData?.nama_kaprodi}</Text>
            <Text style={styles.nip}>NIP. {formData?.nip_kaprodi}</Text>
          </View>
          <View style={styles.signatureColumn}>
            <Text>Mengetahui & menyetujui,</Text>
            <Text>{formData?.dosen_koordinator}</Text>
            <Text style={styles.signatureName}>{formData?.nama_dosen_koordinator}</Text>
            <Text style={styles.nip}>NIP. {formData?.nip_dosen_koordinator}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default SRB;
