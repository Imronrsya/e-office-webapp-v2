import { getCurrentStep } from "@/constant/step";
import {
  CommentsSection,
  ProgressSection,
} from "@/pages/components/CommentandProgress";
import EnhancedSteps from "@/pages/components/EnhanceStep";
import { formatTanggal } from "@/pages/components/FormatTanggalUmumIndo";
import { getStatusTag } from "@/pages/components/StatusTag";
import { AxiosService } from "@/utils/axios";
import { SignerOption, SuratKeluar } from "@/utils/data";
import {
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileOutlined,
  SaveOutlined,
  UploadOutlined,
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
  Upload,
  UploadFile,
  UploadProps,
} from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "umi";
import SuratPengantarAK15 from "../../akademik/pkl/pdf/SuratPengantar";
import SuratRekomendasiBeasiswa from "../../akademik/surat-rekomendasi-beasiswa/pdf/SuratRekomendasi";
import { ResponsiveSpace } from "../../surat-masuk/detail";
import DownloadDOCXSuratPengantarAK15 from "../../akademik/pkl/docx";
import SuratKeteranganAK006 from "../../akademik/surat-keterangan-mahasiswa-untuk-tunjangan-PNSBUMN/pdf";
import { LampiranComponent } from "@/components/Surat/LampiranComponent";

const { Title } = Typography;

const SuratKeluarVerification: React.FC = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const access = useAccess();
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluar | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPdf, setPreviewPDF] = useState(false);
  const [roles, setRoles] = useState<SignerOption[]>([]);
  const [valueToSend, setValueToSend] = useState();
  const [petugas, setPetugas] = useState();
  const [lampiranUrls, setLampiranUrls] = useState<string[]>([]);

  // Label lampiran untuk AK006 (sama seperti di DetailSuratMasukMahasiswa)
  const ak006LampiranLabels = ["KRS Semester berjalan", "KTM"] as const;

  const getLampiranLabel = (idx: number, tipeSurat?: string): string => {
    return tipeSurat === "ak006"
      ? ak006LampiranLabels[idx] || `Lampiran ${idx + 1}`
      : `Lampiran ${idx + 1}`;
  };

  const fetchSuratKeluar = async () => {
    try {
      setLoading(true);
      const axios = new AxiosService();
      const petugas = await axios.get(`/v1/role/petugas`);
      setPetugas(petugas.data.data);
      const response = await axios.get(`/v1/pengajuan/surat-keluar/${id}`);
      setSuratKeluar(response.data.data);
      console.log("Response data:", response.data.data);

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

  const fetchRoles = async () => {
    try {
      const axios = new AxiosService();
      const response = await axios.post("/v1/pegawai/daftar-pegawai", {
        roles: [5, 6, 7, 8, 2, 9, 27],
      });
      setRoles(response.data.data);
    } catch (error) {
      message.error("Gagal mengambil daftar peran");
    }
  };

  useEffect(() => {
    fetchSuratKeluar();
    fetchRoles();
  }, []);

  const handleVerify = async (status: "DISETUJUI" | "DITOLAK") => {
    try {
      // Validate form fields first
      const values = await form.validateFields();

      let role = 0;
      // masih bisa berubah
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
      } else if (access.isSpvSda) {
        role = 27;
      }

      Modal.confirm({
        title:
          status === "DISETUJUI"
            ? "Konfirmasi Persetujuan"
            : "Konfirmasi Penolakan",
        icon:
          status === "DISETUJUI" ? (
            <CheckOutlined style={{ color: "#52c41a" }} />
          ) : (
            <CloseOutlined style={{ color: "#ff4d4f" }} />
          ),
        content:
          status === "DISETUJUI"
            ? "Apakah Anda yakin ingin menyetujui dan meneruskan ke petugas selanjutnya?"
            : "Apakah Anda yakin ingin menolak surat keluar ini?",
        okText: status === "DISETUJUI" ? "Ya, Setujui" : "Ya, Tolak",
        okButtonProps: {
          type: "primary",
          danger: status === "DITOLAK",
        },
        cancelText: "Batal",
        onOk: async () => {
          try {
            if (status === "DISETUJUI") {
              if (
                (access.isSpvAka &&
                  suratKeluar?.status ===
                    "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK") ||
                (access.isKtu &&
                  suratKeluar?.status ===
                    "SURAT_KELUAR_MENUNGGU_VERIFIKASI_MANAJER_TU") ||
                (access.isPetugasAka &&
                  suratKeluar?.status === "PERLU_DIREVISI_PETUGAS_AKADEMIK") ||
                (access.isSpvSda &&
                  suratKeluar?.status ===
                    "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_SUMBERDAYA")
              ) {
                setLoading(true);
                const axios = new AxiosService();
                const result = await axios.patch(
                  `/v1/pengajuan/surat-keluar/${id}/changeStatus`,
                  {
                    status: status,
                    role: role,
                    roleTujuan: access.isSpvAka
                      ? 8
                      : access.isKtu
                        ? 6
                        : access.isPetugasTu
                          ? 4
                          : access.isPetugasAka
                            ? 2
                            : access.isSpvSda
                              ? 8
                              : 0,
                    keterangan: values.keterangan,
                    listLampiran: listLampiran.toString(),
                  },
                );

                if (result) {
                  // Determine action path based on role
                  let actionPath = "/surat-keluar";
                  if (access.isSpvAka) {
                    actionPath = `/surat-keluar/spv/action/${id}`;
                  } else if (access.isKtu) {
                    actionPath = `/surat-keluar/mtu/action/${id}`;
                  } else if (access.isPetugasAka) {
                    actionPath = `/surat-keluar/petugas/action/${id}`;
                  } else if (access.isSpvSda) {
                    actionPath = `/surat-keluar/spv/action/${id}`;
                  }

                  // Navigate to action page
                  navigate(actionPath, {
                    state: {
                      status: "DISETUJUI",
                      message: "Surat berhasil disetujui",
                      data: result.data,
                    },
                  });
                }
              } else {
                setLoading(true);
                const axios = new AxiosService();
                await axios.patch(
                  `/v1/pengajuan/surat-keluar/${id}/changeStatus`,
                  {
                    status: status,
                    role: role,
                    roleTujuan: role,
                    keterangan: values.keterangan,
                  },
                );
              }
            } else if (status === "DITOLAK") {
              if (access.isPetugasAka) {
                console.log("hapus");
              } else {
                setLoading(true);
                const axios = new AxiosService();
                await axios.patch(
                  `/v1/pengajuan/surat-keluar/${id}/changeStatus`,
                  {
                    status: status,
                    role: role,
                    roleTujuan: access.isSpvAka ? 9 : access.isSpvSda ? 1 : 0,
                    keterangan: values.keterangan,
                  },
                );

                // Tentukan path navigasi berdasarkan role untuk kasus penolakan
                let actionPath = "/surat-keluar";
                if (access.isSpvAka) {
                  actionPath = `/surat-keluar/spv/action/${id}`;
                } else if (access.isKtu) {
                  actionPath = `/surat-keluar/mtu/action/${id}`;
                } else if (access.isPetugasAka) {
                  actionPath = `/surat-keluar/petugas/action/${id}`;
                } else if (access.isSpvSda) {
                  actionPath = `/surat-keluar/spv/action/${id}`;
                }

                // Navigasi ke halaman detail-action dengan status DITOLAK
                navigate(actionPath, {
                  state: {
                    status: "DITOLAK",
                    message: "Surat dikembalikan",
                    data: suratKeluar,
                  },
                });
                return;
              }
            }

            message.success(
              `Surat keluar berhasil ${status === "DISETUJUI" ? "disetujui" : "ditolak"}`,
            );
            // Refresh data after successful verification
            fetchSuratKeluar();
          } catch (error) {
            message.error(
              `Gagal ${status === "DISETUJUI" ? "menyetujui" : "menolak"} surat keluar`,
            );
            console.error(error);
          } finally {
            setLoading(false);
          }
        },
        onCancel() {
          setLoading(false);
          fetchSuratKeluar();
        },
      });
      fetchSuratKeluar();
    } catch (error: any) {
      console.log("Validation error caught:", error);
      if (error?.errorFields) {
        // Form validation error
        message.error("Mohon lengkapi semua field yang diperlukan");
      } else {
        // API or other errors
        console.error("Unexpected error in handleVerify:", error);
        message.error("Terjadi kesalahan. Silakan coba lagi.");
      }
    }
  };

  const generateIsiSuratAK006 = (suratKeluar: SuratKeluar) => {
    try {
      const mahasiswaData = JSON.parse(
        suratKeluar.surat_masuk?.information || "{}",
      );

      return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Yang bertanda tangan di bawah ini:</p>
        
        <table style="margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 20px 5px 0; vertical-align: top;">Nama</td>
            <td style="padding: 5px 20px 5px 0;">:</td>
            <td style="padding: 5px 0;">[Nama Pejabat Penandatangan]</td>
          </tr>
          <tr>
            <td style="padding: 5px 20px 5px 0; vertical-align: top;">Jabatan</td>
            <td style="padding: 5px 20px 5px 0;">:</td>
            <td style="padding: 5px 0;">[Jabatan Pejabat]</td>
          </tr>
        </table>

        <p>Dengan ini menerangkan bahwa:</p>

        <table style="margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 20px 5px 0; vertical-align: top;">Nama</td>
            <td style="padding: 5px 20px 5px 0;">:</td>
            <td style="padding: 5px 0;">${mahasiswaData.nama || "-"}</td>
          </tr>
          <tr>
            <td style="padding: 5px 20px 5px 0; vertical-align: top;">NIM</td>
            <td style="padding: 5px 20px 5px 0;">:</td>
            <td style="padding: 5px 0;">${mahasiswaData.nim || "-"}</td>
          </tr>
          <tr>
            <td style="padding: 5px 20px 5px 0; vertical-align: top;">Program Studi</td>
            <td style="padding: 5px 20px 5px 0;">:</td>
            <td style="padding: 5px 0;">${mahasiswaData.program_studi || "-"}</td>
          </tr>
        </table>

        <p>Adalah benar-benar mahasiswa aktif Fakultas Sains dan Matematika Universitas Diponegoro dan merupakan anak dari:</p>

        <table style="margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 20px 5px 0; vertical-align: top;">Nama</td>
            <td style="padding: 5px 20px 5px 0;">:</td>
            <td style="padding: 5px 0;">${mahasiswaData.nama_orang_tua || "-"}</td>
          </tr>
          <tr>
            <td style="padding: 5px 20px 5px 0; vertical-align: top;">NIP/No. Pensiun</td>
            <td style="padding: 5px 20px 5px 0;">:</td>
            <td style="padding: 5px 0;">${mahasiswaData.nip_pensiun_orang_tua || "-"}</td>
          </tr>
          <tr>
            <td style="padding: 5px 20px 5px 0; vertical-align: top;">Pangkat/Golongan</td>
            <td style="padding: 5px 20px 5px 0;">:</td>
            <td style="padding: 5px 0;">${mahasiswaData.pangkat_golongan_orang_tua || "-"}</td>
          </tr>
          <tr>
            <td style="padding: 5px 20px 5px 0; vertical-align: top;">Instansi</td>
            <td style="padding: 5px 20px 5px 0;">:</td>
            <td style="padding: 5px 0;">${mahasiswaData.instansi_orang_tua || "-"}</td>
          </tr>
        </table>

        <p>Surat keterangan ini dibuat untuk keperluan tunjangan PNS/BUMN.</p>
        
        <p style="margin-top: 30px;">Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
      </div>
    `;
    } catch (error) {
      return "<p>Error loading preview data</p>";
    }
  };

  console.log("Surat Keluar:", suratKeluar);

  const handlePreview = () => {
    if (suratKeluar?.surat_masuk?.tipe_suratId === "ak006") {
      // Generate isi surat untuk AK006
      const generatedContent = generateIsiSuratAK006(suratKeluar);
      // Set temporary content untuk preview
      setSuratKeluar({
        ...suratKeluar,
        isi_surat: generatedContent,
      });
    }
    setPreviewVisible(true);
  };

  const handlePreviewPDF = () => {
    setPreviewPDF(true);
  };
  const [isModalVisible, setIsModalVisible] = useState(false);

  // const showRejectModal = (value) => {
  //   setValueToSend(value); // Store the value to be sent
  //   setIsModalVisible(true); // Show the modal
  // };
  // console.log("Data surat keluar:", suratKeluar);

  const [fileSuratKeluar, setFileSuratKeluar] = useState<UploadFile[]>([]);
  const [listLampiran, setListLampiran] = useState<string[]>([]);

  const suratKeluarUploadProps: UploadProps = {
    name: "file",
    maxCount: 1,
    action:
      process.env.UMI_APP_PUBLIC_API_URL + "/v1/pengajuan/lampiran/upload",
    method: "post",
    fileList: fileSuratKeluar,
    beforeUpload: (file) => {
      const isPDF = file.type === "application/pdf";
      const isDOCX =
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.toLowerCase().endsWith(".docx");
      const isAllowed = isPDF || isDOCX;
      const isLt100M = file.size / 1024 / 1024 < 100;

      if (!isAllowed) {
        message.error("You can only upload PDF or DOCX files!");
        return Upload.LIST_IGNORE;
      }

      if (!isLt100M) {
        message.error("File must be smaller than 100MB!");
        return Upload.LIST_IGNORE;
      }

      setFileSuratKeluar([file]);
      return true;
    },
    onChange(info) {
      if (info.file.status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === "done") {
        setListLampiran([...listLampiran, info.file.response.data.location]);
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onRemove: () => {
      setFileSuratKeluar([]);
    },
  };

  return (
    <div className="p-6">
      <Title level={3}>Verifikasi Surat Keluar</Title>
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

      {/* Detail Surat Keluar dan Progres Surat */}
      <Row gutter={16} className="mb-6">
        {/* Detail Surat Keluar */}
        <Col span={24} lg={12} md={24} sm={24}>
          {suratKeluar && (
            <Card title="Detail Surat Keluar" className="h-full">
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
                  {suratKeluar?.nomor_surat || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Tanggal Surat">
                  {formatTanggal(suratKeluar?.createdAt) || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Perihal">
                  {suratKeluar?.hal || "-"}
                </Descriptions.Item>

                <LampiranComponent
                  lampirans={[]}
                />

                <Descriptions.Item label="Status">
                  {getStatusTag(suratKeluar?.status) || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Tujuan Surat">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: suratKeluar?.tujuan_surat || "-",
                    }}
                    style={{ fontSize: "13px" }}
                  />
                </Descriptions.Item>

                <Descriptions.Item label="Tembusan">
                  <Typography.Text style={{ fontSize: "13px" }}>
                    {suratKeluar?.tembusan.join(", ") || "-"}
                  </Typography.Text>
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

      {/* Komentar dan Progress */}
      {/* {suratKeluar && <Row gutter={16} style={{ marginTop: 5 }}> */}
      {/* <Col span={24} lg={24} md={24} sm={24}>
          <CommentsSection
            comments={suratKeluar?.Komentar}
            id={suratKeluar?.id}
            komentator={petugas.nip}
            type={"surat-keluar"}
          />
        </Col>
      </Row>} */}

      {/* <Divider /> */}

      {/* <Card title="Preview Data" style={{ marginTop: 5 }}>
        <Button icon={<EyeOutlined />} onClick={handlePreview}>
          Preview Data
        </Button>
      </Card> */}

      {/* <Divider /> */}

      {
        // 1. KONDISI KHUSUS UNTUK SPV (Menampilkan UI baru dari wireframe & snippet)
        access.isSpvAka &&
        suratKeluar?.status ===
          "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK" ? (
          <Form
            form={form} // Menggunakan form instance utama (atau buat baru jika perlu isolasi total)
            layout="vertical"
            onFinish={(values) => {
              console.log("Form submitted with values:", values);
              handleVerify("DISETUJUI");
            }}
            // initialValues={{ keterangan: suratKeluar?.keteranganTerakhir || '' }} // Jika ada keterangan awal
          >
            <Card title="Tindakan Supervisor" style={{ marginTop: 16 }}>
              {" "}
              {/* Mengganti Card "Form Verifikasi" asli untuk SPV */}
              {/* Preview Data dari Wireframe (menggunakan modal yg sudah ada) */}
              {/* <Button icon={<EyeOutlined />} onClick={handlePreview}>
                    Preview Data
                </Button> */}
              {/* Bagian Operasi File Surat (Adaptasi dari Snippet) */}
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                {/* Preview and Download Section */}
                {!suratKeluar?.Lampiran?.length && (
                  <Space
                    size="middle"
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      icon={<EyeOutlined />}
                      loading={loading}
                      onClick={handlePreviewPDF}
                      style={{ minWidth: 130 }}
                    >
                      Preview PDF Saat Ini
                    </Button>
                  </Space>
                )}

                {/* Upload Section */}
                <div
                  style={{
                    padding: "16px",
                    background: "#fff",
                    borderRadius: "6px",
                    border: "2px solid #f0f0f0",
                  }}
                >
                  <Space
                    size="middle"
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <Form.Item
                      name="docFile"
                      label={
                        <span style={{ fontWeight: 500 }}>
                          Upload DOCX Revisi (Jika Ada Perubahan)
                        </span>
                      }
                      tooltip="Format .docx/.doc. Upload jika Anda melakukan revisi pada file."
                      getValueFromEvent={(e: any) => {
                        if (Array.isArray(e)) {
                          return e;
                        }
                        return e && e.fileList;
                      }}
                      style={{ marginBottom: 0 }}
                    >
                      <Space size="middle">
                        {/* Download buttons first */}
                        {suratKeluar?.Lampiran &&
                        suratKeluar.Lampiran.length > 0 ? (
                          suratKeluar.Lampiran.map((lampiran) => {
                            const fileName = lampiran.link_lampiran
                              .split("/")
                              .pop();
                            return (
                              <div key={lampiran.id} className="mb-2">
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
                                  {fileName || `Lampiran ${lampiran.id}`}
                                </Button>
                              </div>
                            );
                          })
                        ) : (
                          <DownloadDOCXSuratPengantarAK15
                            formData={{
                              tanggal_surat: suratKeluar?.tanggal_surat,
                              nomor_surat: suratKeluar?.no_surat,
                              lampiran: suratKeluar?.lampiran,
                              hal: suratKeluar?.hal,
                              tujuan_surat: suratKeluar?.tujuan_surat,
                              isi_surat: suratKeluar?.isi_surat,
                              tembusan: suratKeluar?.tembusan,
                              Progress: suratKeluar?.Progress,
                              surat_masuk: suratKeluar?.surat_masuk
                                ? {
                                    ...suratKeluar.surat_masuk,
                                    id:
                                      suratKeluar.surat_masuk.id?.toString?.() ??
                                      "",
                                  }
                                : undefined,
                            }}
                            dataTambahan={
                              suratKeluar?.surat_masuk?.information
                                ? JSON.parse(
                                    suratKeluar.surat_masuk.information,
                                  )
                                : {}
                            }
                          />
                        )}
                        {/* Upload button after download buttons */}
                        <Upload
                          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          maxCount={1}
                          beforeUpload={() => false}
                          {...suratKeluarUploadProps}
                        >
                          <Button icon={<UploadOutlined />}>
                            Upload File .docx Revisi
                          </Button>
                        </Upload>
                      </Space>
                    </Form.Item>
                  </Space>
                </div>

                {/* Keterangan Tambahan dari SPV */}
                <Form.Item
                  name="keterangan"
                  label="Keterangan/Catatan Tambahan (Opsional)"
                  style={{ marginBottom: 0 }}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Masukkan keterangan jika ada..."
                  />
                </Form.Item>

                {/* Action Buttons */}
                <Space
                  size="middle"
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    marginTop: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    htmlType="submit" // Memicu onFinish pada Form ini
                    loading={loading}
                    style={{ minWidth: 100 }}
                    onClick={() => {
                      console.log('Button "Simpan & Lanjutkan ke MTU" clicked');
                    }}
                  >
                    Simpan & Lanjutkan ke MTU
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => {
                      console.log("Kembalikan ke Petugas clicked");
                      handleVerify("DITOLAK");
                    }}
                    loading={loading}
                    style={{ minWidth: 100 }}
                  >
                    Kembalikan ke Petugas
                  </Button>
                  <Button
                    icon={<FileOutlined />}
                    onClick={() => {
                      form.resetFields(["docFile", "keterangan"]); // Reset field spesifik
                      message.info("Input revisi telah direset.");
                    }}
                    style={{ minWidth: 100 }}
                  >
                    Reset Input Revisi
                  </Button>
                </Space>
              </Space>
            </Card>
          </Form>
        ) : // 2. KONDISI UNTUK PERAN LAIN YANG MENGGUNAKAN "FORM VERIFIKASI UTAMA" (Blok A asli yang dipertahankan untuk peran lain)
        (access.isKtu &&
            suratKeluar?.status ===
              "SURAT_KELUAR_MENUNGGU_VERIFIKASI_MANAJER_TU") ||
          (access.isDekan &&
            suratKeluar?.status === "SURAT_KELUAR_MENUNGGU_VERIFIKASI_DEKAN") ||
          (access.isWd1 &&
            suratKeluar?.status ===
              "SURAT_KELUAR_MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1") ||
          (access.isPetugasAka &&
            suratKeluar?.status === "PERLU_DIREVISI_PETUGAS_AKADEMIK") ||
          (access.isSpvSda &&
            suratKeluar?.status ===
              "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_SUMBERDAYA") ? (
          <Card title="Form Verifikasi" style={{ marginTop: 5 }}>
            <Form
              form={form} // Menggunakan form instance yang sama, atau buat terpisah jika perlu
              layout="vertical"
              // onFinish untuk peran ini akan memanggil handleVerify standar
              // onFinish={(values) => handleVerify('DISETUJUI', values)} // Anda perlu 'values' jika handleVerify memerlukannya
            >
              <Form.Item name="keterangan" label="Keterangan">
                <Input.TextArea
                  rows={3}
                  placeholder="Tambahkan keterangan (opsional)"
                />
              </Form.Item>

              <Form.Item>
                <Row justify="space-between" align="middle">
                  <Col>
                    <ResponsiveSpace size="middle">
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        // htmlType="submit" // Jika onFinish di Form di atas diaktifkan
                        onClick={() => handleVerify("DISETUJUI")} // Atau panggil handleVerify langsung
                        loading={loading}
                      >
                        {/* Teks dinamis untuk tombol lanjutkan peran non-SPV */}
                        {access.isKtu
                          ? "Lanjutkan ke WD 1"
                          : access.isWd1
                            ? "Lanjutkan ke UPA"
                            : access.isSpvSda
                              ? "Lanjutkan ke MTU"
                              : "Lanjutkan"}
                      </Button>
                      <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={async () => {
                          if (
                            access.isPetugasAka &&
                            suratKeluar?.status ===
                              "PERLU_DIREVISI_PETUGAS_AKADEMIK"
                          ) {
                            // Logika khusus PetugasAka untuk hapus atau aksi lain saat revisi
                            Modal.confirm({
                              title: "Konfirmasi Hapus",
                              icon: <ExclamationCircleOutlined />,
                              content:
                                "Apakah Anda yakin ingin menghapus surat keluar ini karena revisi ditolak?",
                              okText: "Ya, Hapus",
                              okButtonProps: { danger: true },
                              cancelText: "Batal",
                              onOk: async () => {
                                setLoading(true);
                                try {
                                  const axios = new AxiosService();
                                  await axios.delete(
                                    `/v1/pengajuan/surat-keluar/${id}`,
                                  );
                                  message.success(
                                    "Surat keluar berhasil dihapus",
                                  );
                                  // navigate(-1) atau ke halaman daftar surat
                                  window.history.back();
                                } catch (error) {
                                  message.error("Gagal menghapus surat keluar");
                                  console.error(error);
                                } finally {
                                  setLoading(false);
                                }
                              },
                            });
                          } else {
                            // Untuk peran lain (KTU, Dekan, WD1) saat menolak
                            handleVerify("DITOLAK");
                          }
                        }}
                        loading={loading}
                      >
                        {/* Teks dinamis untuk tombol tolak peran non-SPV */}
                        {access.isPetugasAka &&
                        suratKeluar?.status ===
                          "PERLU_DIREVISI_PETUGAS_AKADEMIK"
                          ? "Hapus Pengajuan Revisi"
                          : access.isKtu
                            ? "Kembalikan ke SPV"
                            : access.isWd1
                              ? "Kembalikan ke MTU"
                              : "Tolak"}
                      </Button>
                    </ResponsiveSpace>
                  </Col>
                  <Col>
                    <ResponsiveSpace size="middle">
                      {/* Tombol Edit Surat (SuratModal) jika masih relevan untuk peran ini */}
                      {/* <SuratModal
                        visible={isModalVisible} // Anda perlu state isModalVisible jika ini dipakai
                        setVisible={setIsModalVisible}
                        onCancel={() => setIsModalVisible(false)}
                        detailData={suratKeluar}
                        suratId={id}
                        suratType={suratKeluar?.surat_masuk?.tipe_suratId === "srb" ? "beasiswa" : "ak15"}
                        signers={roles}
                        onSuccess={fetchSuratKeluar}
                      /> */}
                      {/* <Button icon={<EyeOutlined />} onClick={handlePreview}>
                        Preview Data Surat Pengantar
                      </Button> */}
                      <Button
                        icon={<EyeOutlined />}
                        onClick={handlePreviewPDF}
                        loading={loading}
                      >
                        Preview Surat Pengantar
                      </Button>
                    </ResponsiveSpace>
                  </Col>
                </Row>
              </Form.Item>
            </Form>
          </Card>
        ) : // 3. KONDISI UNTUK "FORM VERIFIKASI SEDERHANA" (Blok B asli - untuk Batalkan Pengajuan)
        (access.isPetugasAka &&
            suratKeluar?.status ===
              "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK") ||
          (access.isSpvAka &&
            suratKeluar?.status ===
              "SURAT_KELUAR_MENUNGGU_VERIFIKASI_MANAJER_TU") ||
          (access.isKtu &&
            suratKeluar?.status ===
              "SURAT_KELUAR_MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1") ||
          (access.isSpvSda &&
            suratKeluar?.status ===
              "SURAT_KELUAR_MENUNGGU_VERIFIKASI_MANAJER_TU") ? (
          <Card title="Opsi Tambahan" style={{ marginTop: 5 }}>
            {" "}
            {/* Judul diubah agar lebih sesuai */}
            <Form
              form={form} // Bisa gunakan form yang sama atau form baru jika fieldnya berbeda
              layout="vertical"
            >
              <Form.Item>
                <Row justify="space-between" align="middle">
                  <Col>
                    <ResponsiveSpace size="middle">
                      <Button
                        danger
                        icon={<ExclamationCircleOutlined />}
                        htmlType="submit"
                        onClick={() => handleVerify("DISETUJUI")}
                        loading={loading}
                      >
                        Batalkan Pengajuan
                      </Button>
                    </ResponsiveSpace>
                  </Col>
                  <Col>
                    <ResponsiveSpace size="middle">
                      <Button icon={<EyeOutlined />} onClick={handlePreview}>
                        Preview Data Surat Pengantar
                      </Button>
                      <Button icon={<EyeOutlined />} onClick={handlePreviewPDF}>
                        Preview Surat Pengantar
                      </Button>
                    </ResponsiveSpace>
                  </Col>
                </Row>
              </Form.Item>
            </Form>
          </Card>
        ) : (
          // 4. TIDAK ADA FORM (Blok C asli)
          <></>
        )
      }

      {/* Modals and Divider must be inside the parent element */}
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
        <div
          dangerouslySetInnerHTML={{ __html: suratKeluar?.isi_surat || "" }}
        />
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
            {suratKeluar?.surat_masuk?.tipe_suratId === "ak006" ? (
              <SuratKeteranganAK006 formData={suratKeluar} />
            ) : suratKeluar?.surat_masuk?.tipe_suratId === "srb" ? (
              <SuratRekomendasiBeasiswa formData={suratKeluar} />
            ) : (
              <SuratPengantarAK15 formData={suratKeluar} />
            )}
          </PDFViewer>
        )}
      </Modal>

      <Divider />
    </div>
  );
};

export default SuratKeluarVerification;
