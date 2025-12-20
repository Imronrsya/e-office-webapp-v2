import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Card,
  Steps,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Col,
  ConfigProvider,
  Breadcrumb,
  Avatar,
  Layout,
} from "antd";
import {
  UserOutlined,
  BellOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import idID from "antd/locale/id_ID";
import {
  ProForm,
  ProFormText,
  ProFormDatePicker,
  ProFormInstance,
} from "@ant-design/pro-components";

const { Title, Text } = Typography;
const { Header, Content } = Layout;

// --- TIPE DATA ---
interface MahasiswaData {
  nama: string;
  role: string;
  nim: string;
  email: string;
  departemen: string;
  prodi: string;
  tempatLahir: string;
  tanggalLahir: string;
  no_hp?: string;
  alamat?: string;
}

// --- KOMPONEN FORM (BACKGROUND PUTIH) ---
// Dipisah agar lebih rapi dan "menjadi konteks sendiri"
const FormDataDiri: React.FC<{
  formRef: React.RefObject<ProFormInstance>;
  handleNext: () => void;
}> = ({ formRef, handleNext }) => {
  return (
    <Card
      bordered={false}
      className="shadow-sm rounded-xl"
      style={{ 
        backgroundColor: "#ffffff", 
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)" 
      }}
    >
      <ProForm<MahasiswaData>
        formRef={formRef}
        submitter={false}
        layout="vertical"
        grid={true}
        rowProps={{
          gutter: [48, 16], // Jarak antar kolom horizontal 48px
        }}
      >
        {/* --- DATA READONLY (BG GRAY) --- */}
        <Col span={24} md={12}>
          <ProFormText
            name="nama"
            label="Nama Lengkap"
            disabled
            fieldProps={{ variant: "filled", className: "font-semibold text-gray-800" }}
          />
        </Col>
        <Col span={24} md={12}>
          <ProFormText
            name="role"
            label="Role"
            disabled
            fieldProps={{ variant: "filled", className: "font-semibold text-gray-800" }}
          />
        </Col>

        <Col span={24} md={12}>
          <ProFormText
            name="nim"
            label="NIM"
            disabled
            fieldProps={{ variant: "filled", className: "font-semibold text-gray-800" }}
          />
        </Col>
        <Col span={24} md={12}>
          <ProFormText
            name="email"
            label="Email"
            disabled
            fieldProps={{ variant: "filled", className: "font-semibold text-gray-800" }}
          />
        </Col>

        <Col span={24} md={12}>
          <ProFormText
            name="departemen"
            label="Departemen"
            disabled
            fieldProps={{ variant: "filled", className: "font-semibold text-gray-800" }}
          />
        </Col>
        <Col span={24} md={12}>
          <ProFormText
            name="prodi"
            label="Program Studi"
            disabled
            fieldProps={{ variant: "filled", className: "font-semibold text-gray-800" }}
          />
        </Col>

        <Col span={24} md={12}>
          <ProFormText
            name="tempatLahir"
            label="Tempat Lahir"
            disabled
            fieldProps={{ variant: "filled", className: "font-semibold text-gray-800" }}
          />
        </Col>
        <Col span={24} md={12}>
          <ProFormDatePicker
            name="tanggalLahir"
            label="Tanggal Lahir"
            disabled
            fieldProps={{
              variant: "filled",
              format: "DD/MM/YYYY",
              className: "w-full font-semibold text-gray-800",
            }}
          />
        </Col>

        {/* --- DATA EDITABLE (BG PUTIH) --- */}
        <Col span={24} md={12}>
          <ProFormText
            name="no_hp"
            label="No. HP"
            placeholder="Contoh: 081234567890"
            rules={[{ required: true, message: "Wajib diisi" }]}
            fieldProps={{ size: "large", style: { backgroundColor: "white", borderColor: "#d9d9d9" } }}
          />
        </Col>
        <Col span={24} md={12}>
          <ProFormText
            name="alamat"
            label="Alamat"
            placeholder="Masukkan Alamat Domisili"
            rules={[{ required: true, message: "Wajib diisi" }]}
            fieldProps={{ size: "large", style: { backgroundColor: "white", borderColor: "#d9d9d9" } }}
          />
        </Col>
      </ProForm>
    </Card>
  );
};

export default function DataDiriSKL() {
  const router = useRouter();
  const formRef = useRef<ProFormInstance>();
  const [loading, setLoading] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // --- STEPPER ITEMS (KEMBALI KE ANGKA) ---
  // Sesuai gambar referensi yang menggunakan angka 1, 2, 3, 4
  const stepsItems = [
    { title: "Info Pengajuan" },
    { title: "Detail Pengajuan" },
    { title: "Lampiran" },
    { title: "Review & Ajukan" },
  ];

  // --- FETCH DATA ---
  useEffect(() => {
    const getDataMahasiswa = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const mockData: MahasiswaData = {
          nama: "Ahmad Syaifullah",
          role: "Mahasiswa",
          nim: "24060121130089",
          email: "ahmadsyaifullah@students.undip.ac.id",
          departemen: "Informatika",
          prodi: "S1 - Informatika",
          tempatLahir: "Blora",
          tanggalLahir: "2006-03-18",
          no_hp: "",
          alamat: "",
        };
        if (formRef.current) {
          formRef.current.setFieldsValue(mockData);
        }
      } catch (error) {
        message.error("Gagal mengambil data mahasiswa.");
      } finally {
        setLoading(false);
      }
    };
    getDataMahasiswa();
  }, []);

  const handleNext = async () => {
    try {
      await formRef.current?.validateFields();
      message.success("Draft berhasil disimpan");
    } catch (error) {
      message.error("Mohon lengkapi data wajib.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", width: "100%", justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" }}>
        <Spin size="large" tip="Memuat Data..." />
      </div>
    );
  }

  return (
    <ConfigProvider locale={idID}>
      <Head>
        <title>Identitas Pemohon - SKL</title>
      </Head>

      <Layout style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
        {/* --- 1. HEADER BIRU (FIXED STYLE) --- */}
        {/* Menggunakan style inline agar tidak pecah layoutnya */}
        <Header style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          backgroundColor: "#00509d", 
          padding: "0 32px", 
          height: "64px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%"
        }}>
          {/* Logo Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img 
              src="https://upload.wikimedia.org/wikipedia/id/2/2d/Undip.png" 
              alt="Logo Undip" 
              // Style ini menjamin ukuran logo KECIL dan PAS (40px)
              style={{ height: "40px", width: "auto", filter: "brightness(0) invert(1)" }} 
            />
            <div style={{ lineHeight: "1.2", color: "white" }}>
              <div style={{ fontSize: "12px", opacity: 0.9 }}>Fakultas</div>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>SAINS DAN MATEMATIKA</div>
              <div style={{ fontSize: "10px", opacity: 0.8, fontWeight: 300 }}>UNIVERSITAS DIPONEGORO</div>
            </div>
          </div>

          {/* User Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", color: "white" }}>
            <BellOutlined style={{ fontSize: "18px", cursor: "pointer" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
              <div style={{ textAlign: "right", display: "none", sm: "block" }}>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>Ahmad Douglas</div>
              </div>
              <Avatar size="default" icon={<UserOutlined />} style={{ backgroundColor: "#91caff", color: "#003a8c" }} />
            </div>
          </div>
        </Header>

        {/* --- 2. CONTENT WRAPPER --- */}
        <Content style={{ margin: "0 auto", width: "100%", maxWidth: "1200px", padding: "24px 48px" }}>
          
          {/* --- BREADCRUMB --- */}
          <div style={{ marginBottom: "16px" }}>
             <Breadcrumb
                items={[
                  { title: <><HomeOutlined /> Form Pengajuan Surat</> },
                  { title: 'SKL' },
                  { title: 'Identitas Pemohon' },
                ]}
              />
          </div>

          {/* --- JUDUL & DESKRIPSI --- */}
          <div style={{ marginBottom: "32px" }}>
            <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#262626" }}>
              Identitas Pemohon
            </Title>
            <Text type="secondary" style={{ fontSize: "16px" }}>
              Data berikut diisi secara otomatis berdasarkan data Anda. Mohon periksa kembali dan lengkapi data yang diperlukan.
            </Text>
          </div>

          {/* --- STEPPER (Kembali ke Angka) --- */}
          <div style={{ marginBottom: "40px", padding: "0 40px" }}>
            <Steps
              current={currentStep}
              labelPlacement="vertical"
              items={stepsItems}
              size="small"
              // Ant Design secara default menggunakan angka jika icon tidak diset
              className="font-medium"
            />
          </div>

          {/* --- FORM CARD (KOMPONEN TERPISAH) --- */}
          <FormDataDiri formRef={formRef} handleNext={handleNext} />

          {/* --- FOOTER BUTTONS --- */}
          <div style={{ marginTop: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button
              size="large"
              style={{ borderRadius: "6px", padding: "0 32px" }}
              onClick={() => router.back()}
            >
              Kembali
            </Button>

            <Space size={16}>
              <Button
                size="large"
                style={{ 
                  borderRadius: "6px", 
                  color: "#1890ff", 
                  borderColor: "#1890ff", 
                  fontWeight: 600 
                }}
              >
                Simpan Draft
              </Button>
              <Button
                type="primary"
                size="large"
                style={{ 
                  borderRadius: "6px", 
                  padding: "0 32px", 
                  fontWeight: 600,
                  backgroundColor: "#d9d9d9", // Disabled look (abu-abu)
                  borderColor: "#d9d9d9",
                  color: "rgba(0, 0, 0, 0.25)"
                }}
                disabled
                onClick={handleNext}
              >
                Lanjut
              </Button>
            </Space>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}