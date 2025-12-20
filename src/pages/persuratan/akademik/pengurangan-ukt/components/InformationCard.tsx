import { Card } from "antd";

export function InformationCard() {
  return <Card
    style={{
      marginBottom: 16,
      background: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      width: "100%",
    }}
    variant="borderless"
  >
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <div style={{ marginRight: 16, marginTop: 4 }}>
        <svg
          width="32"
          height="32"
          fill="none"
          viewBox="0 0 32 32"
          style={{ color: "#2563eb" }}
        >
          <circle
            cx="16"
            cy="16"
            r="16"
            fill="#2563eb"
            opacity="0.1" />
          <path
            d="M16 10v6M16 22h.01"
            stroke="#2563eb"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div
          style={{
            fontWeight: 600,
            fontSize: 16,
            color: "#1e293b",
            marginBottom: 4,
          }}
        >
          Informasi Penting untuk Mahasiswa
        </div>
        <div
          style={{ color: "#334155", fontSize: 14, lineHeight: 1.7 }}
        >
          <div>
            Yth. Mahasiswa
            <br />
            Fakultas Sains dan Matematika Universitas Diponegoro
          </div>
          <div style={{ margin: "12px 0 0 0" }}>
            Berikut adalah panduan dan ketentuan dalam pengajuan surat
            pengantar perkembangan tugas akhir:
          </div>
          <ol style={{ margin: "12px 0 0 18px", padding: 0 }}>
            <li>
              <b>Isi formulir dengan lengkap dan benar.</b> Pastikan
              seluruh data mahasiswa, deskripsi, dan data lanjutan
              terisi sesuai dengan kebutuhan akademik.
            </li>
            <li>
              <b>Siapkan lampiran:</b>
              <ul
                style={{
                  margin: "6px 0 0 18px",
                  padding: 0,
                  listStyle: "disc",
                }}
              >
                <li>
                  File tugas akhir dalam format PDF, maksimal 10 MB.
                </li>
              </ul>
            </li>
            <li>
              <b>Setelah mengirim formulir:</b> Pantau status
              pengajuan Anda secara berkala di halaman dasbor.
            </li>
            <li>
              <b>Proses verifikasi:</b> Pengajuan Anda akan
              diverifikasi oleh dosen pembimbing dan pihak fakultas
              sesuai alur.
            </li>
            <li>
              <b>Pengambilan hasil:</b> Setelah disetujui dan
              diproses, hasil dapat diunduh melalui sistem.
            </li>
          </ol>
          <div style={{ marginTop: 12 }}>
            Jika mengalami kendala atau membutuhkan bantuan, silakan
            hubungi petugas akademik fakultas melalui kontak resmi.
          </div>
          <div style={{ marginTop: 12 }}>
            Terima kasih atas perhatian dan kerjasamanya.
          </div>
        </div>
      </div>
    </div>
  </Card>;
}