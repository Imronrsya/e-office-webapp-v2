import { StepDataType } from "@/pages/form/step-form/data";
import { AxiosService } from "@/utils/axios";
import { EyeOutlined, UploadOutlined } from "@ant-design/icons";
import {
  PageContainer,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  StepsForm,
} from "@ant-design/pro-components";
import {
  Button,
  Card,
  Col,
  Form,
  FormInstance,
  message,
  Row,
  Space,
  Spin,
  Upload,
  UploadFile,
  UploadProps,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import useStyles from "../../../form/advanced-form/style.style";
import { Mahasiswa, SuratMasuk, User } from "@/utils/data";
import PopUpPengecekKelengkapanDataMahasiswa from "@/pages/components/PopUpPengecekKelengkapanDataMahasiswa";
import { checkIncompleteData } from "@/constant/step";

type InternalNamePath = (string | number)[];

interface DetailData {
  nama?: string;
  nim?: string;
  semester?: string;
  ipk?: string;
  sks?: string;
  Departemen?: string;
  Prodi?: string;
  jenjang?: string;
  Alamat?: string;
  kontak?: string;
  pengatar_untuk?: string;
  tujuan_surat?: string;
  jabatan?: string;
  instansi?: string;
  alamat_instansi?: string;
  judul?: string;
  nama_dosen_pembimbing?: string;
  nip_dosen_pembimbing?: string;
  dosen_koordinator?: string;
  nama_dosen_koordinator?: string;
  nip_dosen_koordinator?: string;
  nama_kaprodi?: string;
  nip_kaprodi?: string;
  tanggal: string;
}

const fieldLabels = {
  name: "Nama",
  nim: "NIM",
  semester: "Semester",
  SKS: "SKS",
  IPK: "IPK",
  departemen: "Departemen",
  prodi: "Prodi",
  jenjang: "Jenjang",
  alamat: "Alamat",
  kontak: "Kontak",
  pengatar_untuk: "Pengantar Untuk",
  tujuan_surat: "Tujuan Surat",
  jabatan: "Jabatan",
  nama_instansi: "Nama Instansi",
  alamat_instansi: "Alamat Instansi",
  judul: "Judul",
  proposal: "Proposal",
  nama_dosen_pembimbing: "Nama Dosen Pembimbing",
  nip_dosen_pembimbing: "NIP Dosen Pembimbing",
  dosen_koordinator: "Dosen Koordinator         ",
  nama_dosen_koordinator: "Nama Dosen Koordinator",
  nip_dosen_koordinator: "NIP Dosen Koordinator",
  nama_kaprodi: "Nama Kaprodi",
  nip_kaprodi: "NIP Kaprodi",
  tanggal: "Tanggal",
  bulan: "Bulan",
  tahun: "Tahun",
  ktm: "KTM",
};

interface ErrorField {
  name: InternalNamePath;
  errors: string[];
}

const FormPKL: React.FC<Record<string, any>> = () => {
  const { styles } = useStyles();
  const [error, setError] = useState<ErrorField[]>([]);
  const [fileProposal, setFileProposal] = useState<UploadFile[]>([]);
  const [fileKTM, setFileKTM] = useState<UploadFile[]>([]);
  const [fileSignedDocument, setFileSignedDocument] = useState<UploadFile[]>(
    [],
  );
  const [listLampiran, setListLampiran] = useState<string[]>([]);
  const [existingApplication, setExistingApplication] = useState<SuratMasuk>();
  const [isRevisionNeeded, setIsRevisionNeeded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalPDFloadVisible, setIsModalPDFVisible2] = useState(false);
  const [detailData, setDetailData] = useState<DetailData>(null);
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa>();
  const [daftarDosenPembimbing, setDosenPembimbing] = useState<User[]>();
  const [daftarDosenKoordinator, setDosenKoordinator] = useState<User[]>();
  const [daftarKaprodi, setKaprodi] = useState<User[]>();

  const [stepData, setStepData] = useState<StepDataType>({
    payAccount: "ant-design@alipay.com",
    receiverAccount: "test@example.com",
    receiverName: "Alex",
    amount: "500",
    receiverMode: "alipay",
  });

  const handleUpdateClick = () => {
    window.location.href = "/persuratan-mahasiswa/mahasiswa/profile";
    setIsModalVisible(false);
  };

  const formRef = useRef<FormInstance>();

  const mapExistingApplicationToForm = (
    existingApplication: SuratMasuk | null,
  ) => {
    if (!existingApplication) {
      return null;
    }

    try {
      // Parse the information JSON string
      const parsedInfo: DetailData = JSON.parse(
        existingApplication.information || "{}",
      );

      // Map the parsed data to form fields
      const formData = {
        // Data Akademik
        nama: parsedInfo.nama || "",
        nim: parsedInfo.nim || "",
        semester: parsedInfo.semester || "",
        ipk: parsedInfo.ipk || "",
        sks: parsedInfo.sks || "",
        Departemen: parsedInfo.Departemen || "",
        Prodi: parsedInfo.Prodi || "",
        jenjang: parsedInfo.jenjang || "",

        // Keperluan
        Alamat: parsedInfo.Alamat || "",
        kontak: parsedInfo.kontak || "",
        pengatar_untuk: parsedInfo.pengatar_untuk || "",
        tujuan_surat: parsedInfo.tujuan_surat || "",
        jabatan: parsedInfo.jabatan || "",
        instansi: parsedInfo.instansi || "",
        alamat_instansi: parsedInfo.alamat_instansi || "",

        // Data Lanjutan
        tanggal: parsedInfo.tanggal || new Date(),
        judul: parsedInfo.judul || "",
        nama_dosen_pembimbing: parsedInfo.nama_dosen_pembimbing || "",
        nip_dosen_pembimbing: parsedInfo.nip_dosen_pembimbing || "",
        dosen_koordinator: parsedInfo.dosen_koordinator || "",
        nama_dosen_koordinator: parsedInfo.nama_dosen_koordinator || "",
        nip_dosen_koordinator: parsedInfo.nip_dosen_koordinator || "",
        nama_kaprodi: parsedInfo.nama_kaprodi || "",
        nip_kaprodi: parsedInfo.nip_kaprodi || "",
      };

      return formData;
    } catch (error) {
      console.error("Error mapping existing application:", error);
      return null;
    }
  };

  const getKaprodi = async () => {
    try {
      const axios = new AxiosService();
      const getKaprodi = await axios.get<User>("/v1/pegawai/23");
      if (getKaprodi) {
        setKaprodi(getKaprodi.data.data);
      }
    } catch (error) {
      console.error("Error getting kaprodi:", error);
    }
  };

  const getDosenPembimbing = async () => {
    try {
      const axios = new AxiosService();
      const getDosenPembimbing = await axios.get<User>("/v1/pegawai/21");
      if (getDosenPembimbing) {
        // console.log(getDosenPembimbing);
        setDosenPembimbing(getDosenPembimbing.data.data);
      }
    } catch (error) {
      console.error("Error getting dosen pembimbing:", error);
    }
  };

  const getDosenKoordinator = async () => {
    try {
      const axios = new AxiosService();
      const getDosenKoordinator = await axios.get<User>("/v1/pegawai/22");
      // Replace '12345' with actual NIM from user context/session
      if (getDosenKoordinator) {
        setDosenKoordinator(getDosenKoordinator.data.data);
      }
    } catch (error) {
      console.error("Error getting dosen pembimbing:", error);
    }
  };

  const getMahasiswa = async () => {
    setLoading(true);
    try {
      const axios = new AxiosService();
      const getMahasiswa = await axios.get("/v1/mahasiswa");
      if (getMahasiswa) {
        const studentData = getMahasiswa.data.data;
        setMahasiswa(studentData);

        formRef.current?.setFieldsValue({
          nim: studentData.nim,
          departemen: studentData.departemen,
          jenjang: studentData.jenjang,
          prodi: studentData.prodi,
          tahunMasuk: studentData.tahunMasuk,
        });

        // Check if any required field is missing
        const hasIncompleteData = checkIncompleteData(studentData);

        // Only show popup if data is incomplete
        if (hasIncompleteData) {
          setIsModalVisible(true);
        }
      }
    } catch (error) {
      console.error("Error getting mahasiswa:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const axios = new AxiosService();
      const getMahasiswa = await axios.get("/v1/role/mahasiswa");
      if (getMahasiswa && getMahasiswa.data.data.nim !== "") {
        const response = await axios.get(
          `/v1/pengajuan/pemohon/${getMahasiswa.data.data.nim}`,
        );
        if (response) {
          // Check for applications that need revision or are in process
          const pendingApp = response.data.data.find(
            (app) =>
              app.tipe_suratId === "ak15" &&
              [
                "MENUNGGU_LAMPIRAN_TANDA_TANGAN",
                "MENUNGGU_VERIFIKASI_DOSEN_PEMBIMBING",
                "MENUNGGU_VERIFIKASI_DOSEN_KOORDINATOR",
                "MENUNGGU_VERIFIKASI_KAPRODI",
                "MENUNGGU_VERIFIKASI_MANAJER_TU",
                "MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK",
                "MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1",
                "MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK",
                "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK",
                "SURAT_KELUAR_MENUNGGU_VERIFIKASI_MANAJER_TU",
                "SURAT_KELUAR_MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1",
                "PENOMORAN",
              ].includes(app.status),
          );

          // Check for applications that need revision
          const revisionApp = response.data.data.find(
            (app) => app.tipe_suratId === "ak15" && app.status === "REVISI",
          );

          // Prioritize revision application if it exists
          const result = revisionApp || pendingApp;
          setExistingApplication(result);
          // Set revision flag if the application needs revision
          if (revisionApp) {
            setIsRevisionNeeded(true);
          }

          if (result) {
            // If revision needed, stay on form page (step 0), otherwise go to step 1
            setCurrent(revisionApp ? 0 : 1);

            const mappedFormData = mapExistingApplicationToForm(result);
            if (mappedFormData) {
              setDetailData(mappedFormData);
              // Set the form values using formRef after component is mounted
              setTimeout(() => {
                formRef.current?.setFieldsValue(mappedFormData);
              }, 0);

              // If there are existing attachments, set them
              if (result.listLampiran) {
                const attachments = result.listLampiran.split(",");
                setListLampiran(attachments);

                // Map existing attachments to file lists if needed
                attachments.forEach((attachment) => {
                  if (attachment.toLowerCase().includes("proposal")) {
                    setFileProposal([
                      {
                        uid: "-1",
                        name: "Existing Proposal",
                        status: "done",
                        url: attachment,
                      },
                    ]);
                  }
                  if (attachment.toLowerCase().includes("ktm")) {
                    setFileKTM([
                      {
                        uid: "-1",
                        name: "Existing KTM",
                        status: "done",
                        url: attachment,
                      },
                    ]);
                  }
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
      message.error("Failed to check existing applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkExistingApplication();
    getMahasiswa();
    getDosenPembimbing();
    getDosenKoordinator();
    getKaprodi();
  }, []);

  const proposalUploadProps: UploadProps = {
    name: "file",
    maxCount: 1,
    action:
      process.env.UMI_APP_PUBLIC_API_URL + "/v1/pengajuan/lampiran/upload",

    method: "post",
    fileList: fileProposal,
    beforeUpload: (file) => {
      const isPDF = file.type === "application/pdf";
      const isLt100M = file.size / 1024 / 1024 < 100;

      if (!isPDF) {
        message.error("You can only upload PDF files!");
        return Upload.LIST_IGNORE;
      }

      if (!isLt100M) {
        message.error("File must be smaller than 100MB!");
        return Upload.LIST_IGNORE;
      }

      setFileProposal([file]);
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
      setFileProposal([]);
    },
  };

  const ktmUploadProps: UploadProps = {
    name: "file",
    maxCount: 1,
    fileList: fileKTM,
    action:
      process.env.UMI_APP_PUBLIC_API_URL + "/v1/pengajuan/lampiran/upload",
    method: "post",
    beforeUpload: (file) => {
      const isValidType = [
        "image/jpeg",
        "image/png",
        "application/pdf",
      ].includes(file.type);
      const isLt5M = file.size / 1024 / 1024 < 5;

      if (!isValidType) {
        message.error("You can only upload JPG/PNG/PDF files!");
        return Upload.LIST_IGNORE;
      }

      if (!isLt5M) {
        message.error("File must be smaller than 5MB!");
        return Upload.LIST_IGNORE;
      }

      setFileKTM([file]);
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
      setFileKTM([]);
    },
  };

  const handleNext = () => {
    setCurrent(current + 1);
  };

  const handleSubmitForm = async (values: Record<string, any>) => {
    try {
      const formData = new FormData();
      formData.append("tipe_suratId", "ak15");
      formData.append("information", JSON.stringify(values));
      formData.append("listLampiran", listLampiran.toString());

      const axios = new AxiosService();
      let response;

      // If revision needed, use PUT to update existing application
      if (isRevisionNeeded && existingApplication?.id) {
        response = await axios.patch(
          `/v1/pengajuan/${existingApplication.id}`,
          formData,
        );
        message.success("Form resubmitted successfully");
      } else {
        // Otherwise, create new application
        response = await axios.post("/v1/pengajuan", formData);
        message.success("Form submitted successfully");
      }

      if (!response?.status) {
        throw new Error("Submission failed");
      }

      // Reset form state
      setFileProposal([]);
      setFileKTM([]);
      setListLampiran([]);

      // Move to next step
      handleNext();
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("Failed to submit form");
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    setError(errorInfo.errorFields);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  const handleSelectDosenPembimbing = (value, option) => {
    formRef.current?.setFieldsValue({
      nip_dosen_pembimbing: option?.value,
      nama_dosen_pembimbing: option?.label,
    });
  };

  const handleSelectDosenKoordinator = (value, option) => {
    formRef.current?.setFieldsValue({
      nip_dosen_koordinator: option?.value,
      nama_dosen_koordinator: option?.label,
    });
  };

  const handleSelectKaprodi = (value, option) => {
    formRef.current?.setFieldsValue({
      nip_kaprodi: option?.value,
      nama_kaprodi: option?.label,
    });
  };

  const CustomSubmitter = ({ form, onSubmit }: any) => {
    // If revision needed, show the "Kirim Ulang" button
    if (isRevisionNeeded) {
      return (
        <Button
          type="primary"
          onClick={async () => {
            try {
              await form?.validateFields();
              form?.submit();
            } catch (error) {
              console.error("Form validation failed:", error);
            }
          }}
        >
          Kirim Ulang
        </Button>
      );
    }

    // If there's an existing application but not needing revision
    if (existingApplication && !isRevisionNeeded) {
      return (
        <Space>
          <Button type="primary" onClick={handleNext}>
            Ke Halaman Selanjutnya
          </Button>
        </Space>
      );
    }

    // New application
    return (
      <Button
        type="primary"
        onClick={async () => {
          try {
            await form?.validateFields();
            form?.submit();
            handleNext();
          } catch (error) {
            console.error("Form validation failed:", error);
          }
        }}
      >
        Selanjutnya
      </Button>
    );
  };

  return (
    // >
    <PageContainer style={{ width: "100%" }}>
      <StepsForm
        current={current}
        onCurrentChange={setCurrent}
        containerStyle={{ maxWidth: window.innerWidth > 768 ? "100%" : "100%" }}
        submitter={{
          render: (props, _dom) => {
            const buttons = [];

            if (props.step === 0) {
              return (
                <CustomSubmitter form={props.form} onSubmit={props.onSubmit} />
              );
            }

            if (props.step === 1) {
              if (props.onPre) {
                buttons.push(
                  <Button
                    key="prev"
                    onClick={() => props.onPre?.()}
                    loading={loading}
                  >
                    {" "}
                    {}
                    Sebelumnya
                  </Button>,
                );
              }

              if (buttons.length > 0) {
                return <Space>{buttons}</Space>;
              }
              return null;
            }

            if (props.step === 2) {
              return null;
            }

            return null;
          },
        }}
      >
        <StepsForm.StepForm<StepDataType>
          formRef={formRef}
          title="Isi Form PKL"
          initialValues={stepData}
          onFinish={handleSubmitForm}
          onFinishFailed={onFinishFailed}
          style={{
            maxWidth: window.innerWidth > 768 ? "100%" : "100%", // Full width on mobile
            padding: "0 8px",
            margin: "0", // Add some padding
          }}
        >
          {isRevisionNeeded && (
            <Card style={{ marginBottom: "16px" }} variant="borderless">
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
                        clipRule="evenodd"
                      />
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
                      {existingApplication?.keterangan_surat && (
                        <p style={{ marginTop: "8px", fontWeight: 500 }}>
                          Catatan revisi: {existingApplication.keterangan_surat}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card
            style={{
              marginBottom: 24,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
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
                  <circle cx="16" cy="16" r="16" fill="#2563eb" opacity="0.1" />
                  <path
                    d="M16 10v6M16 22h.01"
                    stroke="#2563eb"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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
                    pengantar magang/PKL/KP/TA/Ethical Clearance:
                  </div>
                  <ol style={{ margin: "12px 0 0 18px", padding: 0 }}>
                    <li>
                      <b>Isi formulir dengan lengkap dan benar.</b> Pastikan
                      seluruh data akademik, keperluan, dan data lanjutan terisi
                      sesuai dokumen resmi. Data yang tidak lengkap dapat
                      menyebabkan permohonan ditolak atau dikembalikan untuk
                      revisi.
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
                          File scan KTM (Kartu Tanda Mahasiswa) yang masih
                          aktif, format JPG/PNG/PDF, maksimal 5MB.
                        </li>
                        <li>
                          File proposal kegiatan/penelitian/magang, format PDF,
                          maksimal 100MB.
                        </li>
                      </ul>
                    </li>
                    <li>
                      <b>Setelah mengirim formulir:</b> Pantau status pengajuan
                      Anda secara berkala di halaman dasbor. Jika ada catatan
                      revisi, segera lakukan perbaikan dan kirim ulang.
                    </li>
                    <li>
                      <b>Proses verifikasi:</b> Pengajuan Anda akan diverifikasi
                      oleh dosen pembimbing, koordinator, kaprodi, dan pihak
                      fakultas sesuai alur.
                    </li>
                    <li>
                      <b>Pengambilan surat:</b> Setelah disetujui dan diproses,
                      surat dapat diunduh melalui sistem. Simpan file surat
                      sebagai arsip pribadi.
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
          </Card>

          <Card
            title="Data Akademik"
            className={styles.card}
            variant="borderless"
          >
            <Row gutter={16}>
              <Col span={24} sm={24} md={12} lg={6}>
                <ProFormText
                  label={fieldLabels.name}
                  initialValue={mahasiswa?.user.name}
                  disabled={true}
                  name="nama"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 6,
                  offset: 2,
                }}
                lg={{
                  span: 8,
                }}
                md={{
                  span: 12,
                }}
                sm={24}
              >
                <ProFormText
                  label={fieldLabels.nim}
                  name="nim"
                  initialValue={mahasiswa?.nim}
                  disabled={true}
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 8,
                  offset: 2,
                }}
                lg={{
                  span: 10,
                }}
                md={{
                  span: 24,
                }}
                sm={24}
              >
                <ProFormText
                  label={fieldLabels.semester}
                  name="semester"
                  tooltip="Anda saat ini semester berapa ?"
                  initialValue={mahasiswa?.semester}
                  disabled={true}
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24} sm={24} lg={6} md={12}>
                <ProFormText
                  label={fieldLabels.IPK}
                  name="ipk"
                  tooltip="Tuliskan IPK anda sesuai yang tertera di Transkrip Terbaik pada akun SIAP"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 6,
                  offset: 2,
                }}
                lg={{
                  span: 8,
                }}
                md={{
                  span: 12,
                }}
                sm={24}
              >
                <ProFormText
                  label={fieldLabels.SKS}
                  name="sks"
                  tooltip="Tuliskan jumlah SKS yang sudah anda tempuh hingga saat ini (cek di Transkrip Terbaik pada akun SIAP)"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 8,
                  offset: 2,
                }}
                lg={{
                  span: 10,
                }}
                md={{
                  span: 24,
                }}
                sm={24}
              >
                <ProFormSelect
                  label={fieldLabels.departemen}
                  name="Departemen"
                  initialValue={mahasiswa?.departemen}
                  disabled={true}
                  rules={[
                    {
                      required: true,
                      message: "Mohon dipilih",
                    },
                  ]}
                  options={[
                    {
                      label: "Biologi",
                      value: "Biologi",
                    },
                    {
                      label: "Fisika",
                      value: "Fisika",
                    },
                    {
                      label: "Informatika",
                      value: "Informatika",
                    },
                    {
                      label: "Kimia",
                      value: "Kimia",
                    },
                    {
                      label: "Matematika",
                      value: "Matematika",
                    },
                    {
                      label: "Statistika",
                      value: "Statistika",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24} lg={6} md={12} sm={24}>
                <ProFormSelect
                  label={fieldLabels.prodi}
                  name="Prodi"
                  initialValue={mahasiswa?.prodi}
                  disabled={true}
                  rules={[
                    {
                      required: true,
                      message: "Mohon dipilih",
                    },
                  ]}
                  options={[
                    {
                      label: "Matematika",
                      value: "Matematika",
                    },
                    {
                      label: "Biologi",
                      value: "Biologi",
                    },
                    {
                      label: "Kimia",
                      value: "Kimia",
                    },
                    {
                      label: "Fisika",
                      value: "Fisika",
                    },
                    {
                      label: "Statistika",
                      value: "Statistika",
                    },
                    {
                      label: "Informatika",
                      value: "Informatika",
                    },
                    {
                      label: "Bioteknologi",
                      value: "Bioteknologi",
                    },
                    {
                      label: "Magister Matematika",
                      value: "Magister matematika",
                    },
                    {
                      label: "Magister Biologi",
                      value: "Magister biologi",
                    },
                    {
                      label: "Magister Kimia",
                      value: "Magister kimia",
                    },
                    {
                      label: "Magister Fisika",
                      value: "Magister fisika",
                    },
                    {
                      label: "Doktor Sains dan Matematika",
                      value: "Doktor Sains dan Matematika",
                    },
                    {
                      label: "Profesi Fisikawan Medik",
                      value: "Profesi Fisikawan Medik",
                    },
                  ]}
                  placeholder="Pilih Program Studi"
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 6,
                  offset: 2,
                }}
                lg={{
                  span: 10,
                }}
                md={{
                  span: 24,
                }}
                sm={24}
              >
                <ProFormSelect
                  label={fieldLabels.jenjang}
                  name="jenjang"
                  initialValue={mahasiswa?.jenjang}
                  disabled={true}
                  rules={[
                    {
                      required: true,
                      message: "Mohon dipilih",
                    },
                  ]}
                  options={[
                    {
                      label: "S1",
                      value: "S1",
                    },
                    {
                      label: "S2",
                      value: "S2",
                    },
                    {
                      label: "S3",
                      value: "S3",
                    },
                    {
                      label: "Profesi",
                      value: "Profesi",
                    },
                  ]}
                  placeholder="Pilih Jenjang"
                />
              </Col>
            </Row>
          </Card>
          <Card title="Keperluan" className={styles.card} variant="borderless">
            <Row gutter={16}>
              <Col span={24}>
                <ProFormText
                  label={fieldLabels.alamat}
                  name="Alamat"
                  tooltip="Tuliskan Alamat anda (Sesuai KTP)"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24} lg={6} md={12} sm={24}>
                <ProFormText
                  label={fieldLabels.kontak}
                  name="kontak"
                  tooltip="Tuliskan nomor kontak aktif (Telp/Hp/ Whatsapp) yang dapat dihubungi petugas"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 6,
                  offset: 2,
                }}
                lg={{
                  span: 10,
                }}
                md={{
                  span: 24,
                }}
                sm={24}
              >
                <ProFormSelect
                  label={fieldLabels.pengatar_untuk}
                  name="pengatar_untuk"
                  rules={[
                    {
                      required: true,
                      message: "Silahkan dipilih",
                    },
                  ]}
                  options={[
                    {
                      label: "Survei",
                      value: "Survei",
                    },
                    {
                      label: "Praktek Kerja Lapangan (PKL)",
                      value: "PKL",
                    },
                    {
                      label: "Kerja Praktik (KP)",
                      value: "KP",
                    },
                    {
                      label: "Penelitian Tugas Akhir",
                      value: "penelitian tugas akhir",
                    },
                    {
                      label: "Magang",
                      value: "Magang",
                    },
                    {
                      label: "Ethical Clearance",
                      value: "Ethical Clearance",
                    },
                  ]}
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 6,
                  offset: 2,
                }}
                lg={{
                  span: 8,
                }}
                md={{
                  span: 12,
                }}
                sm={24}
              >
                <ProFormText
                  label={fieldLabels.tujuan_surat}
                  tooltip="Tuliskan pihak yang dituju, bisa sebut Nama atau Kepala/ Pimpinan Instansi"
                  name="tujuan_surat"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24} lg={6} md={12} sm={24}>
                <ProFormText
                  label={fieldLabels.jabatan}
                  tooltip="Tuliskan jabatan pihak yang dituju. Pihak yang akan dikirimi surat tersebut jabatan sebagai apa ?"
                  name="jabatan"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 6,
                  offset: 2,
                }}
                lg={{
                  span: 8,
                }}
                md={{
                  span: 12,
                }}
                sm={24}
              >
                <ProFormText
                  label={fieldLabels.nama_instansi}
                  tooltip="Tuliskan nama Instansi lengkap, minimalisir singkatan."
                  name="instansi"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24} lg={24} md={24} sm={24}>
                <ProFormText
                  label={fieldLabels.alamat_instansi}
                  name="alamat_instansi"
                  tooltip="Tuliskan alamat instansi yang dituju secara lengkap. Upayakan standar alamat POS."
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
            </Row>
          </Card>
          <Card
            title="Data Lanjutan"
            className={styles.card}
            variant="borderless"
          >
            <Row gutter={16}>
              <Col span={24} lg={24} md={24} sm={24}>
                <ProFormText
                  label={fieldLabels.judul}
                  name="judul"
                  tooltip="Tuliskan Judul / Tema Penelitian/ KP/ PKL/ Survey/ Magang"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24} xl={6} lg={8} md={12} sm={24}>
                <ProFormSelect
                  label={fieldLabels.nama_dosen_pembimbing}
                  tooltip="Nama dan Gelar Lengkap"
                  name="nama_dosen_pembimbing"
                  options={daftarDosenPembimbing?.map((dosen) => ({
                    label: dosen.name,
                    value: dosen.Pegawai.nip,
                  }))}
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  fieldProps={{
                    onChange: handleSelectDosenPembimbing,
                  }}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 6,
                  offset: 2,
                }}
                lg={{
                  span: 8,
                }}
                md={{
                  span: 12,
                }}
                sm={24}
              >
                <ProFormText
                  label={fieldLabels.nip_dosen_pembimbing}
                  tooltip="Silahkan lihat website Prodi anda"
                  name="nip_dosen_pembimbing"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24} xl={6} lg={8} md={24} sm={24}>
                <ProFormSelect
                  label={fieldLabels.dosen_koordinator}
                  name="dosen_koordinator"
                  tooltip="Disesuaikan dengan ketentuan di Prodi. Koordinator KP/PKL/TA yang ditunjuk khusus oleh Prodi atau Kepala Laboratorium terkait tema/ judul anda."
                  rules={[
                    {
                      required: true,
                      message: "Mohon dipilih",
                    },
                  ]}
                  options={[
                    {
                      label: "Kepala Laboratorium",
                      value: "Kepala Laboratorium",
                    },
                    {
                      label: "Koordinator KP",
                      value: "Koordinator KP",
                    },
                    {
                      label: "Koordinator PKL",
                      value: "Koordinator PKL",
                    },
                    {
                      label: "Koordinator Tugas Akhir",
                      value: "Koordinator Tugas Akhir",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 6,
                  offset: 2,
                }}
                lg={{
                  span: 8,
                }}
                md={{
                  span: 12,
                }}
                sm={24}
              >
                <ProFormSelect
                  label={fieldLabels.nama_dosen_koordinator}
                  tooltip="Tuliskan nama lengkap dengan gelar"
                  name="nama_dosen_koordinator"
                  options={daftarDosenKoordinator?.map((dosen) => ({
                    label: dosen.name,
                    value: dosen.Pegawai.nip,
                  }))}
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  fieldProps={{
                    onChange: handleSelectDosenKoordinator,
                  }}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 6,
                  offset: 2,
                }}
                lg={{
                  span: 8,
                }}
                md={{
                  span: 12,
                }}
                sm={24}
              >
                <ProFormText
                  label={fieldLabels.nip_dosen_koordinator}
                  name="nip_dosen_koordinator"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24} xl={6} lg={8} md={24} sm={24}>
                <ProFormSelect
                  label={fieldLabels.nama_kaprodi}
                  tooltip="Tuliskan nama lengkap dengan Gelar Ketua Program Studi anda saat ini"
                  name="nama_kaprodi"
                  options={daftarKaprodi?.map((dosen) => ({
                    label: dosen.name,
                    value: dosen.Pegawai.nip,
                  }))}
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  fieldProps={{
                    onChange: handleSelectKaprodi,
                  }}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 6,
                  offset: 2,
                }}
                lg={{
                  span: 8,
                }}
                md={{
                  span: 12,
                }}
                sm={24}
              >
                <ProFormText
                  label={fieldLabels.nip_kaprodi}
                  tooltip="Tuliskan nama Instansi lengkap, minimalisir singkatan."
                  name="nip_kaprodi"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{
                  span: 6,
                  offset: 2,
                }}
                lg={{
                  span: 8,
                }}
                md={{
                  span: 12,
                }}
                sm={24}
              >
                <ProFormDatePicker
                  label={fieldLabels.tanggal}
                  tooltip="Tuliskan tanggal hari kerja (dinas). Jangan hari libur."
                  name="tanggal"
                  rules={[
                    {
                      required: true,
                      message: "Mohon diisi",
                    },
                  ]}
                  placeholder="Pilih tanggal"
                />
              </Col>
            </Row>
          </Card>
          <Card
            title="Upload Berkas"
            className={styles.card}
            variant="borderless"
          >
            <Row gutter={16}>
              <Col xl={6} lg={8} sm={24}>
                <p>
                  File Proposal
                  <br />
                  Format PDF maksimum size file 100 MB
                </p>
                <Form.Item
                  label="Upload Proposal"
                  required
                  tooltip="File PDF maksimum size 100MB"
                >
                  <Upload {...proposalUploadProps}>
                    <Button icon={<UploadOutlined />}>Select Proposal</Button>
                  </Upload>
                </Form.Item>
              </Col>
              <Col
                xl={{
                  span: 6,
                  offset: 2,
                }}
                lg={{
                  span: 8,
                }}
                md={{
                  span: 12,
                }}
                sm={24}
              >
                <p>
                  File KTM
                  <br />
                  Scan / foto / PDF Kartu Tanda Mahasiswa (KTM) yang masih aktif
                </p>
                <Form.Item
                  label="Upload KTM"
                  required
                  tooltip="JPG/PNG/PDF maksimum size 5MB"
                >
                  <Upload {...ktmUploadProps}>
                    <Button icon={<UploadOutlined />}>Select KTM</Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </StepsForm.StepForm>
        <StepsForm.StepForm
          title="Sedang Diproses"
          style={{
            maxWidth: window.innerWidth > 768 ? "100%" : "100%",
            margin: "0 auto",
            padding: "24px",
          }}
          onFinish={async (values) => {
            // Handle form submission here
            console.log("Form values:", values);
          }}
        >
          <Card>
            <div style={{ minHeight: "200px" }}>
              <Space
                direction="vertical"
                style={{
                  width: "100%",
                  marginBottom: "24px",
                }}
              >
                Pengajuan Surat anda sedang di proses fakultas
              </Space>
            </div>

            <Button
              type="default"
              icon={<EyeOutlined />}
              size="large"
              onClick={() => {
                window.location.href = `/persuratan-mahasiswa/surat/detail-pengajuan/${existingApplication?.id}`;
              }}
            >
              Lihat Detail
            </Button>
          </Card>
        </StepsForm.StepForm>
      </StepsForm>
      <PopUpPengecekKelengkapanDataMahasiswa
        mahasiswaData={mahasiswa}
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onUpdate={handleUpdateClick}
        loading={loading}
      />
    </PageContainer>
  );
};
export default FormPKL;
