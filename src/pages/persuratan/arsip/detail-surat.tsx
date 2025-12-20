import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Descriptions,
  message,
  Divider,
  Grid,
  Tag,
} from "antd";
import { FileTextOutlined, ArrowLeftOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const statusTagConfig: Record<string, { color: string; text: string }> = {
  Selesai: { color: "green", text: "Selesai" },
  Disetujui: { color: "green", text: "Disetujui" },
  DISETUJUI: { color: "green", text: "Disetujui" },
  Ditolak: { color: "red", text: "Ditolak" },
  DITOLAK: { color: "red", text: "Ditolak" },
  Terbit: { color: "blue", text: "Terbit" },
  TERBIT: { color: "blue", text: "Terbit" },
};

const DetailSuratArsip: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const surat = location.state;

  if (!surat) {
    message.error("Data surat tidak ditemukan.");
    return (
      <Card style={{ margin: 32 }}>
        <Title level={4}>Data surat tidak ditemukan</Title>
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          Kembali
        </Button>
      </Card>
    );
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: screens.xs ? "16px auto" : "40px auto",
        padding: screens.xs ? 8 : 24,
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Card
        variant="outlined"
        style={{
          boxShadow: "0 2px 12px #f0f1f2",
          borderRadius: 12,
          padding: screens.xs ? 8 : 24,
          minHeight: 420,
          position: "relative",
        }}
        bodyStyle={{ padding: screens.xs ? 12 : 32, paddingBottom: 80 }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 8,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FileTextOutlined style={{ fontSize: 32, color: "#1890ff" }} />
            <div>
              <Title level={4} style={{ margin: 0, marginBottom: 2 }}>
                Detail Arsip Surat
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                ID Pengajuan: {surat.id_pengajuan}
              </Text>
            </div>
          </div>
          <Tag
            color={statusTagConfig[surat.status_terakhir]?.color || "default"}
            style={{
              fontSize: 14,
              borderRadius: 4,
              padding: "0 8px",
              fontWeight: 500,
              lineHeight: "20px",
              height: 22,
              marginTop: 6,
            }}
          >
            {statusTagConfig[surat.status_terakhir]?.text ||
              surat.status_terakhir}
          </Tag>
        </div>
        {/* Divider custom */}
        <Divider
          style={{ margin: "18px 0 10px 0", borderColor: "#f0f0f0" }}
          orientation="left"
        >
          <b>Info Pemohon</b>
        </Divider>
        <Descriptions
          column={1}
          size="middle"
          style={{ marginBottom: 8 }}
          labelStyle={{ width: 140 }}
        >
          <Descriptions.Item label="Nama Pemohon">
            {surat.nama_pemohon}
          </Descriptions.Item>
          <Descriptions.Item label="NIM">{surat.nim}</Descriptions.Item>
          <Descriptions.Item label="Departemen">
            {typeof surat.departemen === 'object' 
              ? surat.departemen?.nama_departemen 
              : surat.departemen || "-"}
          </Descriptions.Item>
        </Descriptions>
        <Divider
          style={{ margin: "18px 0 10px 0", borderColor: "#f0f0f0" }}
          orientation="left"
        >
          <b>Info Surat</b>
        </Divider>
        <Descriptions column={1} size="middle" labelStyle={{ width: 140 }}>
          <Descriptions.Item label="Jenis Surat">
            {surat.jenis_surat}
          </Descriptions.Item>
          <Descriptions.Item label="Tanggal Pengajuan">
            {surat.tanggal_pengajuan
              ? new Date(surat.tanggal_pengajuan).toLocaleDateString()
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Nomor Surat">
            {surat.nomor_surat || "-"}
          </Descriptions.Item>
        </Descriptions>
        {/* Sticky button for mobile, right for desktop */}
        <div
          style={{
            position: screens.xs ? "fixed" : "absolute",
            bottom: screens.xs ? 16 : 32,
            left: screens.xs ? 0 : "auto",
            width: screens.xs ? "100%" : "auto",
            textAlign: screens.xs ? "center" : "right",
            padding: screens.xs ? "0 16px" : 0,
            zIndex: 10,
          }}
        >
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            size="middle"
            style={{ borderRadius: 8, minWidth: 120 }}
            onClick={() => navigate(-1)}
            block={screens.xs}
          >
            Kembali
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DetailSuratArsip;
