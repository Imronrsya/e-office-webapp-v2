import { SuratMasuk } from "@/utils/data";
import { EyeOutlined } from "@ant-design/icons";
import { Card, Space, Button, message } from "antd";

export interface SubmissionSuccessCardProps { 
  suratId: string;
}

export function SubmissionSuccessCard({ 
  suratId 
}: SubmissionSuccessCardProps ) {
  return <Card style={{ width: "100%" }}>
    <div style={{ minHeight: "200px" }}>
      <Space
        direction="vertical"
        style={{
          width: "100%",
          marginBottom: "24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Pengajuan Berhasil Dikirim!
          </div>
          <div style={{ color: "#666" }}>
            Pengajuan Surat Pengantar Perkembangan Tugas Akhir Anda
            sedang diproses fakultas
          </div>
        </div>
      </Space>
    </div>

    <div style={{ textAlign: "center" }}>
      <Button
        type="primary"
        icon={<EyeOutlined />}
        size="large"
        onClick={() => {
          // Tentukan ID yang akan digunakan.
          // Prioritaskan ID dari pengajuan baru (getId).
          // Jika tidak ada, gunakan ID dari pengajuan yang sudah ada.

          if (suratId) {
            window.location.href = `/persuratan-mahasiswa/surat/detail-pengajuan/${suratId}`;
          } else {
            // Pengaman jika karena alasan tertentu ID tidak ditemukan
            message.error(
              "Gagal membuka halaman detail: ID pengajuan tidak ditemukan."
            );
          }
        } }
      >
        Lihat Detail Pengajuan
      </Button>
    </div>
  </Card>;
}
