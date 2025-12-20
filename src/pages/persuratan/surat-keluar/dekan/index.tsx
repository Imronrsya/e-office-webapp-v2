import { getCurrentStep } from "@/constant/step";
import {
  CommentsSection,
  ProgressSection,
} from "@/pages/components/CommentandProgress";
import EnhancedSteps from "@/pages/components/EnhanceStep";
import { formatTanggal } from "@/pages/components/FormatTanggalUmumIndo";
import { getStatusTag } from "@/pages/components/StatusTag";
import { AxiosService } from "@/utils/axios";
import { SuratKeluar, SuratMasuk } from "@/utils/data";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { PDFViewer } from "@react-pdf/renderer";
import { useAccess } from "@umijs/max";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Row,
  Space,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "umi";
import SuratPengantarAK15 from "../../akademik/pkl/pdf/SuratPengantar";
import SuratRekomendasiBeasiswa from "../../akademik/surat-rekomendasi-beasiswa/pdf/SuratRekomendasi";
import SuratKeteranganAK006 from "../../akademik/surat-keterangan-mahasiswa-untuk-tunjangan-PNSBUMN/pdf";
import SuratKeteranganAK007 from "../../akademik/surat-keterangan-mahasiswa/pdf";

const { Title, Text } = Typography;
const { TextArea } = Input;

const DetailSuratKeluarDekan: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { id } = useParams();
  const access = useAccess();
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluar | null>(null);
  const [data, setData] = useState<SuratMasuk | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [previewPdf, setPreviewPDF] = useState(false);
  const [petugas, setPetugas] = useState();
  const [lampiranUrls, setLampiranUrls] = useState<string[]>([]);

  const ak006LampiranLabels = ["KRS Semester berjalan", "KTM"] as const;
  const ak007LampiranLabels = ["KTM"] as const;

  const getLampiranLabel = (idx: number, tipeSurat?: string): string => {
    if (tipeSurat === "ak006") {
      return ak006LampiranLabels[idx] || `Lampiran ${idx + 1}`;
    } else if (tipeSurat === "ak007") {
      return ak007LampiranLabels[idx] || `Lampiran ${idx + 1}`;
    } else {
      return `Lampiran ${idx + 1}`;
    }
  };

  const getCurrentUserRole = () => {
    if (access.isDekan) return 5;
    if (access.isPetugasAka) return 9;
    if (access.isSpvAka) return 2;
    if (access.isWd1) return 6;
    if (access.isPetugasTu) return 4;
    if (access.isKtu) return 8;
    if (access.isSpvSda) return 27;
    return 0;
  };

  const currentUserRole = getCurrentUserRole();

  const fetchSuratKeluar = async () => {
    try {
      setLoading(true);
      const axios = new AxiosService();
      const petugas = await axios.get(`/v1/role/petugas`);
      setPetugas(petugas.data.data);
      const response = await axios.get(`/v1/pengajuan/surat-keluar/${id}`);
      setSuratKeluar(response.data.data);
      // console.log("Response data:", response.data.data);

      // Build presigned URLs untuk lampiran surat keluar
      const lampiran = response?.data?.data?.Lampiran || [];
      if (Array.isArray(lampiran) && lampiran.length > 0) {
        const urls: string[] = [];
        for (const lam of lampiran) {
          const fd = new FormData();
          fd.append("object_name", lam.link_lampiran);
          fd.append("jenis_file", "lampiran");
          fd.append("Expired", "3600");
          try {
            const res: any = await axios.post(`/minio/get-file`, fd);
            const presigned = res?.data?.body?.data?.data;
            if (presigned) urls.push(presigned);
          } catch (e) {
            console.warn(
              "Gagal mendapatkan URL lampiran untuk",
              lam.link_lampiran,
            );
          }
        }
        setLampiranUrls(urls);
      }
    } catch (error) {
      message.error("Gagal mengambil detail surat keluar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuratKeluar();
  }, []);

  const handleAction = async (
    action: "DISETUJUI" | "DITOLAK",
    values?: any,
  ) => {
    Modal.confirm({
      title: `Apakah anda yakin ingin ${action === "DISETUJUI" ? "menyetujui" : "menolak"} surat keluar ini?`,
      content: "Tindakan ini tidak dapat dibatalkan",
      okText: "Ya",
      cancelText: "Tidak",
      onOk: async () => {
        try {
          setLoading(true);
          let role = 0;

          if (access.isDekan) {
            role = 5;
          } else if (access.isPetugasAka) {
            role = 9;
          } else if (access.isSpvAka) {
            role = 2;
          } else if (access.isWd1) {
            role = 6;
          } else if (access.isPetugasTu) {
            role = 4;
          } else if (access.isKtu) {
            role = 8;
          }

          const axios = new AxiosService();
          if (action === "DISETUJUI") {
            if (suratKeluar?.status === "PENOMORAN") {
              await axios.patch(
                `/v1/pengajuan/surat-keluar/${id}/changeStatus`,
                {
                  status: action,
                  role: role,
                  roleTujuan: role, //upa
                  keterangan: values.keterangan,
                },
              );
            } else {
              await axios.patch(
                `/v1/pengajuan/surat-keluar/${id}/changeStatus`,
                {
                  status: action,
                  role: role,
                  roleTujuan: 10, //upa
                  keterangan: values.keterangan,
                  isDocx:
                    suratKeluar?.Lampiran?.some((lampiran) =>
                      lampiran.link_lampiran.toLowerCase().endsWith(".pdf"),
                    ) === true,
                },
              );
            }

            // Tambahkan navigasi khusus untuk Dekan setelah menyetuju
            navigate(`/surat-keluar/dekan/action/${id}`, {
              state: {
                status: action,
                previousStatus: suratKeluar?.status,
              },
            });
          } else if (action === "DITOLAK") {
            if (suratKeluar?.tipe_suratId == "ak006") {
              // console.log("AK006 DITOLAKKKKKKKK");
              await axios.patch(
                `/v1/pengajuan/surat-keluar/${id}/changeStatus`,
                {
                  status: action,
                  role: role,
                  roleTujuan: 1,
                  keterangan: values.keterangan,
                },
              );
            } else {
              await axios.patch(
                `/v1/pengajuan/surat-keluar/${id}/changeStatus`,
                {
                  status: action,
                  role: role,
                  roleTujuan: 9, //9
                  keterangan: values.keterangan,
                },
              );
            }
          }

          message.success(
            `Surat keluar berhasil ${action === "DISETUJUI" ? "diterbitkan" : "ditolak"}`,
          );

          // Tambahkan navigasi khusus untuk Dekan setelah menyetuju
          navigate(`/surat-keluar/dekan/action/${id}`, {
            state: {
              status: action,
              previousStatus: suratKeluar?.status,
            },
          });
        } catch (error) {
          message.error(
            `Gagal ${action === "DITOLAK" ? "menerbitkan" : "menolak"} surat keluar`,
          );
        } finally {
          setLoading(false);
        }
        fetchSuratKeluar();
      },
    });
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // console.log("STATUS SURAT KELUAR", suratKeluar);

  return (
    <div className="p-6">
      <Row justify="space-between" align="middle" className="mb-4">
        <Col>
          <Title level={3}>Penerbitan Surat</Title>
        </Col>
      </Row>
      <Divider />

      <Card>
        <EnhancedSteps
          currentStep={getCurrentStep(
            suratKeluar?.surat_masuk?.tipe_suratId,
            suratKeluar?.surat_masuk || undefined,
          )}
          progresses={suratKeluar?.surat_masuk?.progresses}
          tipe_suratId={suratKeluar?.surat_masuk?.tipe_suratId}
        />
      </Card>
      <Divider />

      {/* Informasi Surat dan Progres Surat */}
      <Row gutter={16} className="mb-6">
        {/* Informasi Surat */}
        <Col span={24} lg={12} md={24} sm={24}>
          {suratKeluar && (
            <Card title="Informasi Surat" className="h-full">
              <Descriptions
                column={1}
                size="small"
                colon={false}
                labelStyle={{
                  fontWeight: 500,
                  color: "#595959",
                  width: "110px",
                }}
                contentStyle={{
                  color: "#262626",
                }}
              >
                <Descriptions.Item label="Nomor Surat">
                  {suratKeluar?.nomor_surat || "Belum ada nomor"}
                </Descriptions.Item>

                <Descriptions.Item label="Tanggal Surat">
                  {formatTanggal(suratKeluar?.createdAt)}
                </Descriptions.Item>

                <Descriptions.Item label="Perihal">
                  {suratKeluar?.hal}
                </Descriptions.Item>

                <Descriptions.Item label="Status">
                  {getStatusTag(suratKeluar?.status || "")}
                </Descriptions.Item>

                <Descriptions.Item label="Lampiran">
                  <div style={{ maxWidth: "100%", width: "100%" }}>
                    {Array.isArray(suratKeluar?.Lampiran) &&
                    suratKeluar.Lampiran.length > 0 ? (
                      suratKeluar.Lampiran.map((lampiran: any, idx: number) => {
                        const fileName = lampiran.link_lampiran
                          ?.split("/")
                          ?.pop();
                        const url = lampiranUrls[idx];
                        const label = getLampiranLabel(
                          idx,
                          suratKeluar?.surat_masuk?.tipe_suratId,
                        );

                        return (
                          <div
                            key={lampiran.id || idx}
                            style={{
                              marginBottom: 6,
                              maxWidth: "100%",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                maxWidth: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={fileName || label}
                            >
                              <a
                                href={
                                  url
                                    ? `${process.env.UMI_APP_PUBLIC_API_URL}/v2/lampiran?filename=${url}`
                                    : "#"
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: "13px",
                                  color: "#1890ff",
                                  textDecoration: "none",
                                  display: "inline-block",
                                  maxWidth: "100%",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                onClick={(e) => {
                                  if (!url) e.preventDefault();
                                }}
                              >
                                {label}
                              </a>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: "13px", fontStyle: "italic" }}
                      >
                        Tidak ada lampiran
                      </Typography.Text>
                    )}
                  </div>
                </Descriptions.Item>

                <Descriptions.Item label="Tembusan">
                  <Typography.Text style={{ fontSize: "13px" }}>
                    {suratKeluar?.tembusan?.join(", ") || "Tidak ada tembusan"}
                  </Typography.Text>
                </Descriptions.Item>

                <Descriptions.Item label="Penandatangan">
                  {suratKeluar?.pemberi_ttd?.jabatan || "Belum ditentukan"}
                </Descriptions.Item>

                <Descriptions.Item label="Tujuan Surat">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: suratKeluar?.tujuan_surat || "",
                    }}
                    style={{ fontSize: "13px" }}
                  />
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Col>

        {/* Progres Surat */}
        <Col span={24} lg={12} md={24} sm={24}>
          {suratKeluar && (
            <ProgressSection progresses={suratKeluar?.Progress} />
          )}
        </Col>
      </Row>

      <Divider />

      <Card title="Preview Isi Surat" style={{ marginTop: 5 }}>
        {/* Tampilkan tombol preview jika ada isi surat */}
        {suratKeluar?.isi_surat && (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => setPreviewVisible(true)}
            style={{ marginBottom: 16 }}
          >
            Preview Isi Surat
          </Button>
        )}

        {/* Jika ada isi surat (HTML), tampilkan preview langsung (opsional, bisa dihapus jika hanya ingin modal) */}
        {/* 
        {suratKeluar?.isi_surat && (
          <div
        style={{ marginTop: 16, border: '1px solid #eee', padding: 16, borderRadius: 4 }}
        dangerouslySetInnerHTML={{ __html: suratKeluar.isi_surat }}
          />
        )} 
        */}

        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            onClick={() => setPreviewPDF(true)}
            type="default"
          >
            Preview Surat Keluar (PDF)
          </Button>
        </Space>
      </Card>

      <Divider />

      {(access.isSpvAka &&
        suratKeluar?.status ===
          "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK") ||
      (access.isKtu &&
        suratKeluar?.status ===
          "SURAT_KELUAR_MENUNGGU_VERIFIKASI_MANAJER_TU") ||
      (access.isDekan &&
        suratKeluar?.status === "SURAT_KELUAR_MENUNGGU_VERIFIKASI_DEKAN") ||
      (access.isWd1 &&
        suratKeluar?.status ===
          "SURAT_KELUAR_MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1") ? (
        <Card title="Tindakan">
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => handleAction("DISETUJUI", values)}
          >
            <Form.Item name="keterangan" label="Keterangan (opsional)">
              <TextArea
                rows={4}
                placeholder="Keterangan catatan jika diperlukan"
              />
            </Form.Item>

            <Form.Item>
              <Space size="middle">
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  htmlType="submit"
                  loading={loading}
                >
                  Terbitkan Surat
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleAction("DITOLAK", form.getFieldsValue())}
                  loading={loading}
                >
                  Kembalikan Surat
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ) : access.isWd1 && suratKeluar?.status === "PENOMORAN" ? (
        <Card title="Tindakan">
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => handleAction("DISETUJUI", values)}
          >
            <Form.Item>
              <Space size="middle">
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  htmlType="submit"
                  loading={loading}
                >
                  Batalkan Penerbitan
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <></>
      )}

      {/* Komentar */}
      {/* {suratKeluar && (
        <Row gutter={16} style={{ marginTop: 5 }}>
          <Col span={24}>
            <CommentsSection
              comments={suratKeluar?.Komentar}
              id={suratKeluar?.id}
              komentator={petugas?.nip}
              type={"surat-keluar"}
            />
          </Col>
        </Row>
      )} */}

      <Modal
        title="Preview Surat Keluar"
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Tutup
          </Button>,
        ]}
      >
        <div className="p-4">
          <div
            dangerouslySetInnerHTML={{ __html: suratKeluar?.isi_surat || "" }}
          />
        </div>
      </Modal>
      <Modal
        title="Preview PDF Surat Pengantar"
        visible={previewPdf}
        onCancel={() => setPreviewPDF(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewPDF(false)}>
            Tutup
          </Button>,
        ]}
      >
        {suratKeluar && (
          <PDFViewer width="100%" height="1000px">
            {suratKeluar?.surat_masuk?.tipe_suratId === "srb" ? (
              <SuratRekomendasiBeasiswa formData={suratKeluar} />
            ) : suratKeluar?.surat_masuk?.tipe_suratId === "ak006" ? (
              <SuratKeteranganAK006
                formData={suratKeluar}
                currentUserRole={currentUserRole}
              />
            ) : suratKeluar?.surat_masuk?.tipe_suratId === "ak007" ? (
              <SuratKeteranganAK007
                formData={suratKeluar}
                currentUserRole={currentUserRole}
              />
            ) : (
              <SuratPengantarAK15 formData={suratKeluar} />
            )}
          </PDFViewer>
        )}
      </Modal>
    </div>
  );
};

export default DetailSuratKeluarDekan;
