import { StepDataType } from "@/pages/form/step-form/data";
import { AxiosService } from "@/utils/axios";
import { EyeOutlined, UploadOutlined } from "@ant-design/icons";
import {
  PageContainer,
  ProFormDatePicker,
  ProFormDateYearRangePicker,
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

  tempat_lahir?: string;
  tanggal_lahir?: string;
  ips?: string;
  tahun_akademik?: string;
  nama_beasiswa?: string;
}

const fieldLabels = {
  name: "Nama",
  nim: "NIM",
  semester: "Semester",
  SKS: "SKS",
  IPK: "IPK",
  departemen: "Jurusan",
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

  tempat_lahir: "Tempat Lahir",
  tanggal_lahir: "Tanggal Lahir",
  IPS: "IPS",
  tahun_akademik: "Tahun Akademik Terdaftar sebagai Mahasiswa FSM Undip",
  nama_beasiswa: "Nama Beasiswa",
};

interface ErrorField {
  name: InternalNamePath;
  errors: string[];
}

const FormRekomendasiBeasiswa: React.FC<Record<string, any>> = () => {
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
        // Data Mahasiswa
        nama: parsedInfo.nama || "",
        nim: parsedInfo.nim || "",
        semester: parsedInfo.semester || "",
        ipk: parsedInfo.ipk || "",
        sks: parsedInfo.sks || "",
        departemen: parsedInfo.Departemen || "",
        Prodi: parsedInfo.Prodi || "",
        jenjang: parsedInfo.jenjang || "",

        // Data Akademik
        Alamat: parsedInfo.Alamat || "",
        kontak: parsedInfo.kontak || "",
        pengatar_untuk: parsedInfo.pengatar_untuk || "",
        tujuan_surat: parsedInfo.tujuan_surat || "",
        jabatan: parsedInfo.jabatan || "",
        instansi: parsedInfo.instansi || "",
        alamat_instansi: parsedInfo.alamat_instansi || "",

        tempat_lahir: parsedInfo.tempat_lahir || "",
        tanggal_lahir: parsedInfo.tanggal_lahir || "",
        tahun_akademik: parsedInfo.tahun_akademik || "",
        IPS: parsedInfo.IPS || "",
        nama_beasiswa: parsedInfo.nama_beasiswa || "",
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
        console.log(getKaprodi);
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
        console.log(getDosenPembimbing);
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
    try {
      const axios = new AxiosService();
      const getMahasiswa = await axios.get<Mahasiswa>("/v1/mahasiswa");
      if (getMahasiswa) {
        console.log("Received mahasiswa data:", getMahasiswa.data.data);
        setMahasiswa(getMahasiswa.data.data);
      }
    } catch (error) {
      console.error("Error getting mahasiswa:", error);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const axios = new AxiosService();
      const getMahasiswa = await axios.get("/v1/role/mahasiswa");

      if (getMahasiswa) {
        const response = await axios.get(
          `/v1/pengajuan/pemohon/${getMahasiswa.data.data.nim}`,
        );

        // Check for applications that need revision or are in process
        const pendingApp = response.data.data.find(
          (app) =>
            app.tipe_suratId === "srb" &&
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
          (app) => app.tipe_suratId === "srb" && app.status === "REVISI",
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
            console.log(mappedFormData);
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
      console.log("hey");
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
      formData.append("tipe_suratId", "srb");
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
          render: (props, dom) => {
            if (props.step === 1) {
              return dom;
            } else if (props.step === 2) {
              return null;
            }
            return (
              <CustomSubmitter form={props.form} onSubmit={props.submit} />
            );
          },
        }}
      >
        <StepsForm.StepForm<StepDataType>
          formRef={formRef}
          title="Isi Form Rekomendasi Beasiswa"
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
          <p>
            Yth. Mahasiswa
            <br />
            Fakultas Sains dan Matematika Undip
            <br />
            Sehubungan dengan layanan permohonan surat rekomendasi beasiswa di
            Lingkungan Fakultas Sains dan Matematika Universitas Diponegoro,
            Bersama ini diinformasikan kepada mahasiswa sebagai berikut :<br />
            1. Mahasiswa (Pemohon) mengisi lengkap formulir ini.
            <br />
            2. Setelah submit formulir ini, cek berkala halaman dasbor anda,
            apabila telah selesai dapat di-download
            <br />
            3. Selesai
            <br />
            Demikian, semoga bermanfaat.
            <br />
          </p>
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
                xl={{ span: 8, offset: 2 }}
                lg={{ span: 10 }}
                md={{ span: 24 }}
                sm={24}
              >
                <ProFormText
                  label={fieldLabels.tempat_lahir}
                  name="tempat_lahir"
                  rules={[{ required: true, message: "Mohon diisi" }]}
                  placeholder=""
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24} sm={24} lg={6} md={12}>
                <ProFormDatePicker
                  label={fieldLabels.tanggal_lahir}
                  name="tanggal_lahir"
                  rules={[{ required: true, message: "Mohon diisi" }]}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{ span: 6, offset: 2 }}
                lg={{ span: 8 }}
                md={{ span: 12 }}
                sm={24}
              >
                <ProFormText
                  label={fieldLabels.kontak}
                  name="kontak"
                  tooltip="Tuliskan nomor kontak aktif (Telp/Hp/ Whatsapp) yang dapat dihubungi petugas"
                  rules={[{ required: true, message: "Mohon diisi" }]}
                />
              </Col>
            </Row>
          </Card>
          <Card
            title="Data Akademik"
            className={styles.card}
            variant="borderless"
          >
            <Row gutter={16} align="bottom">
              <Col span={24} lg={6} md={12} sm={24}>
                <ProFormDateYearRangePicker
                  label={fieldLabels.tahun_akademik}
                  name="tahun_akademik"
                  tooltip="Contoh: 2021/2022"
                  rules={[{ required: true, message: "Mohon diisi" }]}
                />
              </Col>
              <Col
                span={24}
                xl={{ span: 6, offset: 2 }}
                lg={{ span: 10 }}
                md={{ span: 24 }}
                sm={24}
              >
                <ProFormSelect
                  label={fieldLabels.departemen}
                  name="Jurusan"
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
              <Col
                span={24}
                xl={{ span: 6, offset: 2 }}
                lg={{ span: 8 }}
                md={{ span: 12 }}
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
              <Col span={24} lg={6} md={12} sm={24}>
                <ProFormText
                  label={fieldLabels.IPK}
                  name="IPK"
                  rules={[{ required: true, message: "Mohon diisi" }]}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{ span: 6, offset: 2 }}
                lg={{ span: 8 }}
                md={{ span: 12 }}
                sm={24}
              >
                <ProFormText
                  label={fieldLabels.IPS}
                  name="IPS"
                  rules={[{ required: true, message: "Mohon diisi" }]}
                  placeholder=""
                />
              </Col>
              <Col
                span={24}
                xl={{ span: 6, offset: 2 }}
                lg={{ span: 8 }}
                md={{ span: 12 }}
                sm={24}
              >
                <ProFormText
                  label={fieldLabels.nama_beasiswa}
                  name="nama_beasiswa"
                  rules={[{ required: true, message: "Mohon diisi" }]}
                  placeholder=""
                />
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
    </PageContainer>
  );
};
export default FormRekomendasiBeasiswa;
