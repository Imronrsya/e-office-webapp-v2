import { Card } from "antd";

export function RevisionNoticeCard({ keterangan_surat }: { keterangan_surat: string; }) {
  return <Card style={{ marginBottom: "16px" }} bordered={false}>
    <div
      style={{
        backgroundColor: "#FFFBEB",
        padding: "16px",
        borderRadius: "6px",
        borderLeft: "4px solid #FBBF24",
      }}
    >
      <div style={{ display: "flex" }}>
        <div style={{ flexShrink: 0 }}>
          <svg
            style={{
              height: "20px",
              width: "20px",
              color: "#FBBF24",
            }}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd" />
          </svg>
        </div>
        <div style={{ marginLeft: "12px" }}>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#92400E",
            }}
          >
            Perlu Direvisi
          </h3>
          <div
            style={{
              marginTop: "8px",
              fontSize: "14px",
              color: "#B45309",
            }}
          >
            <p>
              Pengajuan surat Anda perlu diperbaiki. Silakan periksa
              kembali data yang Anda masukkan dan kirim ulang
              formulir.
            </p>
            {keterangan_surat && (
              <p style={{ marginTop: "8px", fontWeight: 500 }}>
                Catatan revisi: {keterangan_surat}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  </Card>;
}