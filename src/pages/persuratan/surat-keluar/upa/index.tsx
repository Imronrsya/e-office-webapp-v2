import { getCurrentStep } from "@/constant/step";
import EnhancedSteps from "@/pages/components/EnhanceStep";
import { formatTanggal } from "@/pages/components/FormatTanggalUmumIndo";
import { AxiosService } from "@/utils/axios";
import { SuratKeluar } from "@/utils/data";
import {
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { PDFViewer } from "@react-pdf/renderer";
import { useAccess } from "@umijs/max";
import {
  Badge,
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
  Spin,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "umi";
import SuratPengantarAK15 from "../../akademik/pkl/pdf/SuratPengantar";
import SuratRekomendasiBeasiswa from "../../akademik/surat-rekomendasi-beasiswa/pdf/SuratRekomendasi";
import SuratKeteranganAK006 from "../../akademik/surat-keterangan-mahasiswa-untuk-tunjangan-PNSBUMN/pdf";
import SuratKeteranganAK007 from "../../akademik/surat-keterangan-mahasiswa/pdf";
import { LampiranComponent } from "@/components/Surat/LampiranComponent";

const { Title, Text } = Typography;
const { TextArea } = Input;

const DetailSuratKeluarUPA: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const access = useAccess();
  const { id } = useParams();
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluar | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [latestNumber, setLatestNumber] = useState<string>("");
  const [currentCounter, setCurrentCounter] = useState<number>(0);
  // const [previewFormData, setPreviewFormData] = useState<any>(null);
  const [dynamicPreviewData, setDynamicPreviewData] = useState<any>(null);
  const [previewType, setPreviewType] = useState<"static" | "dynamic">(
    "static",
  );

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
    if (access.isUPA) return 10;
    return 0;
  };

  const currentUserRole = getCurrentUserRole();
  console.log("Current User Role:", currentUserRole);
  const romanNumerals = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];

  const generateSuratNumber = () => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const year = now.getFullYear();
    const romanMonth = romanNumerals[month];

    // Increment counter for XXXX part
    const newCounter = currentCounter + 1;
    setCurrentCounter(newCounter);

    // Pad the counter with zeros
    const paddedCounter = newCounter.toString().padStart(4, "0");

    // Conditional format based on surat type
    let generatedNumber;

    if (
      suratKeluar?.surat_masuk?.tipe_suratId === "ak006" ||
      suratKeluar?.surat_masuk?.tipe_suratId === "ak007"
    ) {
      // Format khusus untuk AK006
      generatedNumber = `${paddedCounter}/UN7.F8.4/AK/${romanMonth}/${year}`;
    } else {
      // Format default untuk surat lainnya
      generatedNumber = `${paddedCounter}/UN7.F8/AK/${romanMonth}/${year}`;
    }

    form.setFieldsValue({
      nomor_surat: generatedNumber,
    });
  };

  const fetchLatestCounter = async () => {
    try {
      const axios = new AxiosService();
      const response = await axios.get("/v1/pengajuan/latest-counter");
      const data = response.data as { counter: number };
      setCurrentCounter(data.counter || 0);
    } catch (error) {
      console.error("Failed to fetch latest counter:", error);
      message.error("Gagal mengambil nomor urut terakhir");
    }
  };

  const fetchSuratKeluar = async () => {
    try {
      setLoading(true);
      const axios = new AxiosService();
      const response = await axios.get(`/v1/pengajuan/surat-keluar/${id}`);
      console.log("Response data:", response.data.data);
      const data = response.data as { data: SuratKeluar };
      setSuratKeluar(data.data);
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
    // fetchLatestCounter();
  }, []);

  if (!suratKeluar) {
    return <Spin></Spin>
  }



  const handleAssignNumber = async (values: any) => {
    try {
      setLoading(true);
      const axios = new AxiosService();
      if (suratKeluar?.status === "PENOMORAN") {
        await axios.patch(
          `/v1/pengajuan/surat-keluar/${id}/giveNoSurat`,
          {
            nomorSurat: values.nomor_surat,
            keterangan: values.keterangan,
            counter: currentCounter, // Send the current counter to update on backend
            isDocx:
              suratKeluar?.Lampiran && suratKeluar.Lampiran.length > 0
                ? true
                : false,
          },
          {
            timeout: 10000, // 10 seconds timeout
          },
        );

        // Navigate to detail-action page after successful numbering
        navigate(`/surat-keluar/upa/action/${id}`, {
          state: {
            status: "DISETUJUI",
            previousStatus: suratKeluar?.status,
            isNumbered: true, // Add flag to indicate successful numbering
          },
        });
        return; // Stop execution here
      } else {
        await axios.patch(`/v1/pengajuan/surat-keluar/${id}/changeStatus`, {
          status: "DITOLAK",
          role: 10,
          roleTujuan: 10,
          keterangan: values.keterangan,
        });
      }

      message.success("Nomor surat berhasil ditetapkan");
    } catch (error) {
      message.error("Gagal menetapkan nomor surat");
    } finally {
      setLoading(false);
    }
    fetchSuratKeluar();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return <Badge status="success" text="Diterbitkan" />;
      case "numbered":
        return <Badge status="processing" text="Sudah Diberi Nomor" />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  const handlePreviewSuratKeluarPDF = async () => {
    try {
      setLoading(true);
      const axios = new AxiosService();
      const response = (await axios.get(
        `/v1/pengajuan/surat-keluar/${id}/extract-docx`,
      )) as {
        data: {
          status: string;
          data: any;
        };
      };

      if (response && response.data && response.data.status === "Success") {
        const extractedData = response.data.data;
        console.log("Extracted DOCX content:", extractedData.raw_docx_content);

        if (extractedData.isi_surat || extractedData.tujuan_surat) {
          setDynamicPreviewData(extractedData);
          setPreviewType("dynamic");
          setPreviewVisible(true);
          message.success(
            "Menampilkan PDF dengan data revisi terbaru dari DOCX",
          );
        } else {
          message.warning("Data DOCX tidak lengkap, menggunakan template");
          setPreviewType("static");
          setPreviewVisible(true);
        }
        // message.success('Data DOCX berhasil dibaca, menampilkan PDF dengan data terbaru');
      } else {
        // Fallback ke static
        message.warning("Gagal mengambil data dari DOCX, menggunakan template");
        setPreviewType("static");
        setPreviewVisible(true);
      }
    } catch (error) {
      console.error("Error in handlePreviewSuratKeluarPDF:", error);
      // Fallback ke static preview
      message.warning("Terjadi kesalahan, menggunakan template default");
      setPreviewType("static");
      setPreviewVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // const handlePreviewStaticPDF = () => {
  //   setPreviewType('static');
  //   setDynamicPreviewData(null);
  //   setPreviewVisible(true);
  // };

  return (
    <div className="p-6">
      <Row justify="space-between" align="middle" className="mb-4">
        <Col>
          <Title level={3}>Pemberian Nomor Surat Keluar</Title>
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

      <Card className="mb-6">
        <Descriptions
          bordered
          column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}
          title={
            <Space>
              Status Surat {getStatusBadge(suratKeluar?.status || "")}
            </Space>
          }
        >
          <Descriptions.Item label="Tanggal Surat">
            {formatTanggal(suratKeluar?.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Perihal" span={2}>
            {suratKeluar?.hal}
          </Descriptions.Item>
          <Descriptions.Item label="Lampiran">
            <LampiranComponent
              lampirans={suratKeluar.surat_masuk.lampirans ?? []}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Tujuan Surat" span={2}>
            <div
              dangerouslySetInnerHTML={{
                __html: suratKeluar?.tujuan_surat || "",
              }}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Tembusan" span={2}>
            {suratKeluar?.tembusan?.join(", ")}
          </Descriptions.Item>
          <Descriptions.Item label="Penandatangan" span={2}>
            {suratKeluar?.pemberi_ttd.jabatan}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider />
      <Card title="Preview Isi Surat" className="mb-6">
        <Space size="middle" direction="vertical" style={{ width: "100%" }}>
          {/* ✅ TOMBOL PREVIEW STATIS */}
          {/* <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            onClick={handlePreviewStaticPDF}
          >
            Preview PDF (Template)
          </Button> */}

          {/* ✅ TOMBOL PREVIEW DINAMIS - YANG UTAMA */}
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={handlePreviewSuratKeluarPDF}
            loading={loading}
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
            }}
          >
            Preview Surat Keluar (PDF) - Terbaru
          </Button>

          {/* ✅ TOMBOL DOWNLOAD DOCX - TETAP ADA */}
          {suratKeluar?.Lampiran &&
            suratKeluar.Lampiran.filter((lampiran) =>
              lampiran.link_lampiran.toLowerCase().endsWith(".docx"),
            )
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .slice(0, 1)
              .map((lampiran) => {
                const fileName = lampiran.link_lampiran.split("/").pop();
                return (
                  <div key={lampiran.id}>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = lampiran.link_lampiran;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      type="default"
                    >
                      Download DOCX Terbaru
                    </Button>
                  </div>
                );
              })}
        </Space>
      </Card>

      <Divider />

      {access.isUPA && suratKeluar?.surat_masuk.status === "PENOMORAN" ? (
        <Card title="Form Pemberian Nomor Surat">
          <Form form={form} layout="vertical" onFinish={handleAssignNumber}>
            <Row gutter={16}>
              <Col span={24} lg={12}>
                <Form.Item
                  name="nomor_surat"
                  label="Nomor Surat"
                  tooltip="Format: XXXX/UN7.F8/AK/I/2025"
                  rules={[{ required: true, message: "Masukkan nomor surat" }]}
                >
                  <Input
                    prefix={<FileTextOutlined />}
                    placeholder="Contoh: 0001/UN7.F8/AK/I/2025"
                    suffix={
                      <Tooltip title="Generate nomor otomatis">
                        <Button
                          type="text"
                          icon={<ReloadOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            generateSuratNumber();
                          }}
                        />
                      </Tooltip>
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="keterangan" label="Keterangan (opsional)">
              <TextArea
                rows={4}
                placeholder="Tambahkan keterangan jika diperlukan"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={loading}
              >
                Simpan Nomor Surat
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ) : access.isUPA && suratKeluar?.surat_masuk.status === "DISETUJUI" ? (
        <Card title="Form Pemberian Nomor Surat">
          <Form form={form} layout="vertical" onFinish={handleAssignNumber}>
            <Form.Item>
              <Button
                danger
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={loading}
              >
                Batalkan Penomoran
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <></>
      )}

      <Modal
        title={`Preview Surat Keluar ${previewType === "dynamic" ? "(Data Revisi DOCX)" : "(Template Database)"}`}
        visible={previewVisible}
        onCancel={() => {
          setPreviewVisible(false);
          setDynamicPreviewData(null);
          setPreviewType("static");
        }}
        width={800}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setPreviewVisible(false);
              setDynamicPreviewData(null);
              setPreviewType("static");
            }}
          >
            Tutup
          </Button>,
        ]}
      >
        {(suratKeluar || dynamicPreviewData) && (
          <PDFViewer
            width="100%"
            height="1000px"
            key={`pdf-${Date.now()}-${previewType}`}
          >
            {(() => {
              let formDataToUse;

              if (previewType === "dynamic" && dynamicPreviewData) {
                // ✅ MERGE: Prioritaskan data dari DOCX untuk konten yang direvisi
                formDataToUse = {
                  ...suratKeluar, // Base data dari database

                  // ✅ Override dengan data dari DOCX (yang sudah di-parse)
                  hal: dynamicPreviewData.hal || suratKeluar?.hal,
                  tujuan_surat:
                    dynamicPreviewData.tujuan_surat ||
                    suratKeluar?.tujuan_surat,
                  isi_surat:
                    dynamicPreviewData.isi_surat || suratKeluar?.isi_surat,
                  tembusan:
                    dynamicPreviewData.tembusan || suratKeluar?.tembusan,

                  // ✅ Tetap gunakan data database untuk nomor surat, dll
                  nomor_surat: suratKeluar?.nomor_surat,
                  lampiran: suratKeluar?.lampiran,
                  tanggal_surat: suratKeluar?.tanggal_surat,
                };
              } else {
                // Static preview
                formDataToUse = suratKeluar;
              }

              // Render PDF component
              if (formDataToUse?.surat_masuk?.tipe_suratId === "srb") {
                return <SuratRekomendasiBeasiswa formData={formDataToUse} />;
              } else if (formDataToUse?.surat_masuk?.tipe_suratId === "ak15") {
                return <SuratPengantarAK15 formData={formDataToUse ?? {}} />;
              } else if (formDataToUse?.surat_masuk?.tipe_suratId === "ak006") {
                return (
                  <SuratKeteranganAK006
                    formData={formDataToUse ?? {}}
                    currentUserRole={currentUserRole}
                  />
                );
              } else if (formDataToUse?.surat_masuk?.tipe_suratId === "ak007") {
                return (
                  <SuratKeteranganAK007
                    formData={formDataToUse ?? {}}
                    currentUserRole={currentUserRole}
                  />
                );
              }
            })()}
          </PDFViewer>
        )}
      </Modal>

      <Modal
        title="Riwayat Surat"
        visible={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
      >
        <Timeline>
          {suratKeluar?.tracking?.map(
            (
              item: {
                status: string;
                timestamp: string;
                actor: string;
                notes?: string;
              },
              index: number,
            ) => (
              <Timeline.Item key={index}>
                <Text strong>{item.status}</Text>
                <br />
                <Text type="secondary">
                  {item.timestamp} - {item.actor}
                </Text>
                {item.notes && <p className="mt-2">Catatan: {item.notes}</p>}
              </Timeline.Item>
            ),
          )}
        </Timeline>
      </Modal>
    </div>
  );
};

export default DetailSuratKeluarUPA;
