import PDFStatusViewer from "@/components/PDF/viewer";
import { AxiosService } from "@/utils/axios";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import {
  EyeOutlined,
  FilePdfOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
} from "@ant-design/pro-components";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Upload,
  UploadFile,
  UploadProps,
  Popover,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import useStyles from "../../../form/advanced-form/style.style";
import { generatePDF } from "@/helper/helper";
import { Viewer } from "@pdfme/ui";
import { Mahasiswa, SuratMasuk, User } from "@/utils/data";
import AK8 from "./pdf";
import AK8DetailDescriptions from "@/pages/components/AK8DetailData";
import PopUpPengecekKelengkapanDataMahasiswa from "@/pages/components/PopUpPengecekKelengkapanDataMahasiswa";
import { checkIncompleteData } from "@/constant/step";

type InternalNamePath = (string | number)[];

interface DetailData {
  nama?: string;
  nim?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  kontak?: string;

  departemen?: string;
  tanggal_lulus?: string;
  ipk?: string;

  nama_ketua_departemen?: string;
  nip_ketua_departemen?: string;
}

const fieldLabels = {
  name: "Nama",
  nim: "NIM",
  tempat_lahir: "Tempat Lahir",
  tanggal_lahir: "Tanggal Lahir",
  alamat: "Alamat",
  kontak: "Kontak",

  departemen: "Departemen",
  tanggal_lulus: "Tanggal Lulus",
  ipk: "IPK",

  nama_ketua_departemen: "Nama Ketua Departemen",
  nip_ketua_departemen: "NIP Ketua Departemen",
};

interface ErrorField {
  name: InternalNamePath;
  errors: string[];
}

const FormSKL: React.FC<Record<string, any>> = () => {
  const { styles } = useStyles();
  const [error, setError] = useState<ErrorField[]>([]);
  const [fileKTM, setFileKTM] = useState<UploadFile[]>([]);
  const [fileBeritaAcaraKelulusan, setFileBeritaAcaraKelulusan] = useState<
    UploadFile[]
  >([]);
  const [fileBeritaAcaraUjian, setFileBeritaAcaraUjian] = useState<
    UploadFile[]
  >([]);
  const [fileDaftarPrestasi, setFileDaftarPrestasi] = useState<UploadFile[]>(
    [],
  );
  const [fileSignedDocument, setFileSignedDocument] = useState<UploadFile[]>(
    [],
  );
  const [listLampiran, setListLampiran] = useState<string[]>([]);
  const [existingApplication, setExistingApplication] = useState<SuratMasuk>();
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalPDFloadVisible, setIsModalPDFloadVisible] = useState(false);
  const [detailData, setDetailData] = useState<DetailData>(null);
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa>();
  const [daftarKetuaDepartemen, setDaftarKetuaDepartemen] = useState<User[]>();
  const [isRevisionNeeded, setIsRevisionNeeded] = useState<boolean>(false);

  const formRef = useRef<any>();

  const mapExistingApplicationToForm = (
    existingApplication: SuratMasuk | null,
  ) => {
    if (!existingApplication) {
      return null;
    }
    try {
      const parsedInfo: DetailData = JSON.parse(
        existingApplication.information || "{}",
      );
      const formData = {
        nama: parsedInfo.nama || "",
        nim: parsedInfo.nim || "",
        tempat_lahir: parsedInfo.tempat_lahir || "",
        tanggal_lahir: parsedInfo.tanggal_lahir || "",
        alamat: parsedInfo.alamat || "",
        kontak: parsedInfo.kontak || "",

        // Data Akademik
        departemen: parsedInfo.departemen || "",
        tanggal_lulus: parsedInfo.tanggal_lulus || "",
        ipk: parsedInfo.ipk || "",
        nama_ketua_departemen: parsedInfo.nama_ketua_departemen || "",
        nip_ketua_departemen: parsedInfo.nip_ketua_departemen || "",
      };
      return formData;
    } catch (error) {
      console.error("Error mapping existing application:", error);
      return null;
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
          // Check for applications that need revision
          const revisionApp = response.data.data.find(
            (app) => app.tipe_suratId === "ak8" && app.status === "REVISI",
          );

          // Check for applications that are in process
          const pendingApp = response.data.data.find(
            (app) =>
              app.tipe_suratId === "ak8" &&
              [
                "MENUNGGU_VERIFIKASI_SEKRETARIS_KADEP",
                "MENUNGGU_VERIFIKASI_KADEP",
                "MENUNGGU_VERIFIKASI_ADMIN_DEPARTEMEN",
                "MENUNGGU_VERIFIKASI_MANAJER_TU",
                "MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK",
                "MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK",
                "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK",
                "SURAT_KELUAR_MENUNGGU_VERIFIKASI_MANAJER_TU",
                "SURAT_KELUAR_MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1",
                "PENOMORAN",
              ].includes(app.status),
          );

          // Prioritize revision application if it exists
          const result = revisionApp || pendingApp;
          setExistingApplication(result);

          // Set revision flag if the application needs revision
          if (revisionApp) {
            setIsRevisionNeeded(true);
          }

          if (result) {
            const mappedFormData = mapExistingApplicationToForm(result);
            if (mappedFormData) {
              setDetailData(mappedFormData);
              formRef.current?.setFieldsValue(mappedFormData);
            }

            if (result.listLampiran) {
              const attachments = result.listLampiran.split(",");
              setListLampiran(attachments);

              // Map existing attachments to file lists
              attachments.forEach((attachment) => {
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
                if (
                  attachment.toLowerCase().includes("berita acara kelulusan")
                ) {
                  setFileBeritaAcaraKelulusan([
                    {
                      uid: "-1",
                      name: "Existing Berita Acara Kelulusan",
                      status: "done",
                      url: attachment,
                    },
                  ]);
                }
                if (attachment.toLowerCase().includes("berita acara ujian")) {
                  setFileBeritaAcaraUjian([
                    {
                      uid: "-1",
                      name: "Existing Berita Acara Ujian",
                      status: "done",
                      url: attachment,
                    },
                  ]);
                }
                if (attachment.toLowerCase().includes("daftar prestasi")) {
                  setFileDaftarPrestasi([
                    {
                      uid: "-1",
                      name: "Existing Daftar Prestasi",
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
      console.error(error);
      message.error("Failed to check existing applications");
    } finally {
      setLoading(false);
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

  const handleUpdateClick = () => {
    window.location.href = "/persuratan-mahasiswa/mahasiswa/profile";
    setIsModalVisible(false);
  };

  const handleSelectKetuaDepartemen = (value, option) => {
    formRef.current?.setFieldsValue({
      nip_ketua_departemen: option?.value,
      nama_ketua_departemen: option?.label,
    });
  };

  const getKetuaDepartemen = async () => {
    try {
      const axios = new AxiosService();
      const getKadep = await axios.get<User>("/v1/pegawai/25");
      if (getKadep) {
        setDaftarKetuaDepartemen(getKadep.data.data);
      }
    } catch (error) {
      console.error("Error getting dosen pembimbing:", error);
    }
  };

  useEffect(() => {
    getMahasiswa();
    getKetuaDepartemen();
    checkExistingApplication();
  }, []);

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
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
        if (info.file.response) {
          setListLampiran([...listLampiran, info.file.response.data.location]);
        }
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onRemove: () => {
      setFileKTM([]);
    },
  };

  const BeritaAcaraKelulusanUploadProps: UploadProps = {
    name: "file",
    maxCount: 1,
    fileList: fileBeritaAcaraKelulusan,
    action:
      process.env.UMI_APP_PUBLIC_API_URL + "/v1/pengajuan/lampiran/upload",
    method: "post",
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
      setFileBeritaAcaraKelulusan([file]);
      return true;
    },
    onChange(info) {
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
        if (info.file.response) {
          setListLampiran([...listLampiran, info.file.response.data.location]);
        }
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onRemove: () => {
      setFileBeritaAcaraKelulusan([]);
    },
  };

  const BeritaAcaraUjianUploadProps: UploadProps = {
    name: "file",
    maxCount: 1,
    fileList: fileBeritaAcaraUjian,
    action:
      process.env.UMI_APP_PUBLIC_API_URL + "/v1/pengajuan/lampiran/upload",
    method: "post",
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
      setFileBeritaAcaraUjian([file]);
      return true;
    },
    onChange(info) {
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
        if (info.file.response) {
          setListLampiran([...listLampiran, info.file.response.data.location]);
        }
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onRemove: () => {
      setFileBeritaAcaraUjian([]);
    },
  };

  const DaftarPrestasiUploadProps: UploadProps = {
    name: "file",
    maxCount: 1,
    fileList: fileDaftarPrestasi,
    action:
      process.env.UMI_APP_PUBLIC_API_URL + "/v1/pengajuan/lampiran/upload",
    method: "post",
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
      setFileDaftarPrestasi([file]);
      return true;
    },
    onChange(info) {
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
        if (info.file.response) {
          setListLampiran([...listLampiran, info.file.response.data.location]);
        }
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onRemove: () => {
      setFileDaftarPrestasi([]);
    },
  };

  const onFinish = async (values: Record<string, any>) => {
    try {
      // Validasi apakah semua file telah diunggah
      if (!fileKTM.length) {
        message.error("Harap Upload File KTM");
        return;
      }
      if (!fileBeritaAcaraKelulusan.length) {
        message.error("Harap Upload File Berita Acara Kelulusan");
        return;
      }
      if (!fileBeritaAcaraUjian.length) {
        message.error("Harap Upload File Berita Acara Ujian Sarjana");
        return;
      }
      if (!fileDaftarPrestasi.length) {
        message.error("Harap Upload File Daftar Prestasi Akademik");
        return;
      }

      setLoading(true);
      // Siapkan data form untuk pengajuan
      const formData = new FormData();
      formData.append("tipe_suratId", "ak8");
      formData.append("information", JSON.stringify(values));
      formData.append("listLampiran", listLampiran.toString());

      const axios = new AxiosService();

      // If we're revising an existing application, use PUT to update it
      if (isRevisionNeeded && existingApplication) {
        const response = await axios.patch(
          `/v1/pengajuan/${existingApplication.id}`,
          formData,
        );
        message.success("Form resubmitted successfully");
        if (response.status === 200) {
          message.success("Revisi SKL Berhasil diserahkan ke Departemen");
          window.location.href = `/persuratan-mahasiswa/surat/detail-pengajuan/${existingApplication?.id}`;
        } else {
          message.error("Revisi SKL Gagal diserahkan ke Departemen");
        }
      } else {
        // For new applications, use POST
        const response = await axios.post("/v1/pengajuan", formData);
        if (response.status === 201) {
          message.success("Pengajuan SKL Berhasil diserahkan ke Departemen");
          window.location.href = "/persuratan-mahasiswa";
        } else {
          message.error("Pengajuan SKL Gagal diserahkan ke Departemen");
        }
      }
    } catch (error) {
      console.error(error);
      message.error("Terjadi kesalahan saat submit form");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    setError(errorInfo.errorFields);
  };

  // Jika sudah terdapat pengajuan, tampilkan pesan informasi dan tombol untuk melihat progress
  if (!loading && existingApplication && !isRevisionNeeded) {
    return (
      <PageContainer>
        <Card title="Pengajuan SKL Sudah Diajukan" bordered={false}>
          <p>
            Anda telah melakukan pengajuan SKL. Silakan cek detail pengajuan
            Anda.
          </p>
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
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  // Fungsi untuk menampilkan info error (mirip dengan contoh proform)
  const getErrorInfo = (errors: ErrorField[]) => {
    const errorCount = errors.filter((item) => item.errors.length > 0).length;
    if (!errors || errorCount === 0) {
      return null;
    }
    const scrollToField = (fieldKey: string) => {
      const labelNode = document.querySelector(`label[for="${fieldKey}"]`);
      if (labelNode) {
        labelNode.scrollIntoView(true);
      }
    };
    const errorList = errors.map((err) => {
      if (!err || err.errors.length === 0) {
        return null;
      }
      const key = err.name[0] as string;
      return (
        <li
          key={key}
          className={styles.errorListItem}
          onClick={() => scrollToField(key)}
        >
          <span className={styles.errorMessage}>{err.errors[0]}</span>
          <span className={styles.errorField}>{fieldLabels[key]}</span>
        </li>
      );
    });
    return (
      <span className={styles.errorIcon}>
        <Popover
          title="Form Error Info"
          content={errorList}
          overlayClassName={styles.errorPopover}
          trigger="click"
        >
          <span>{errorCount}</span>
        </Popover>
      </span>
    );
  };

  return (
    <PageContainer>
      {isRevisionNeeded && (
        <Alert
          message="Revisi Diperlukan"
          description="Pengajuan SKL Anda memerlukan revisi. Silakan periksa kembali informasi yang Anda masukkan dan unggah file yang diperlukan."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <ProForm
        formRef={formRef}
        layout="vertical"
        hideRequiredMark
        initialValues={detailData || {}}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        submitter={{
          render: (props, dom) => (
            <FooterToolbar>
              {getErrorInfo(error)}
              {dom.map((btn, index) => {
                if (index === 1) {
                  // Modify the submit button text for revisions
                  return React.cloneElement(btn as React.ReactElement, {
                    children: isRevisionNeeded ? "Kirim Revisi" : "Submit",
                  });
                }
                return btn;
              })}
            </FooterToolbar>
          ),
        }}
      >
        <p>
          Yth. Mahasiswa
          <br />
          Fakultas Sains dan Matematika Undip
          <br />
          Sehubungan dengan layanan permohonan surat keterangan lulus di
          Lingkungan Fakultas Sains dan Matematika Universitas Diponegoro,
          bersama ini diinformasikan kepada mahasiswa sebagai berikut :
          <br />
          1. Mahasiswa (Pemohon) mengisi lengkap formulir ini. Siapkan lampiran
          File Scan KTM, Berita Acara Kelulusan, Berita Acara Ujian Sarjana,
          Daftar Prestasi Akademik yang ditandatangani Dekan.
          <br />
          2. Setelah mengisi formulir dan submit, silakan cek berkala halaman
          dasbor Anda. Apabila telah selesai, SKL dapat diambil.
          <br />
          3. Selesai.
          <br />
          Demikian, semoga bermanfaat.
          <br />
        </p>

        {isRevisionNeeded && (
          <Card
            title="Catatan Revisi"
            className={styles.card}
            variant="borderless"
          >
            <p>
              <strong>Alasan Revisi:</strong>{" "}
              {existingApplication?.catatan || "Tidak ada catatan spesifik"}
            </p>
            <p>
              Harap perbaiki data yang diperlukan dan unggah kembali dokumen
              yang diperlukan.
            </p>
          </Card>
        )}

        <Card
          title="Data Mahasiswa"
          className={styles.card}
          variant="borderless"
        >
          <Row gutter={16}>
            <Col span={24} lg={6} md={12} sm={24}>
              <ProFormText
                label={fieldLabels.name}
                name="nama"
                initialValue={mahasiswa?.user.name}
                disabled={true}
                rules={[{ required: true, message: "Mohon diisi" }]}
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
                span={24}
                label={fieldLabels.nim}
                name="nim"
                initialValue={mahasiswa?.nim}
                disabled={true}
                rules={[{ required: true, message: "Mohon diisi" }]}
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
                label={fieldLabels.tempat_lahir}
                name="tempat_lahir"
                rules={[{ required: true, message: "Mohon diisi" }]}
                placeholder=""
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24} lg={6} md={12} sm={24}>
              <ProFormDatePicker
                label={fieldLabels.tanggal_lahir}
                name="tanggal_lahir"
                rules={[{ required: true, message: "Mohon diisi" }]}
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
                label={fieldLabels.alamat}
                name="alamat"
                tooltip="Tuliskan Alamat Anda (Sesuai KTP)"
                rules={[{ required: true, message: "Mohon diisi" }]}
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
                label={fieldLabels.kontak}
                name="kontak"
                tooltip="Tuliskan nomor kontak aktif (Telp/Hp/Whatsapp)"
                rules={[{ required: true, message: "Mohon diisi" }]}
                placeholder=""
              />
            </Col>
          </Row>
        </Card>

        <Card
          title="Data Akademik"
          className={styles.card}
          variant="borderless"
        >
          <Row gutter={24}>
            <Col span={24} lg={6} md={12} sm={24}>
              <ProFormSelect
                label={fieldLabels.departemen}
                name="departemen"
                initialValue={mahasiswa?.departemen}
                disabled={true}
                tooltip="Telah dinyatakan lulus ujian Sarjana pada Departemen/Program Studi"
                rules={[{ required: true, message: "Mohon dipilih" }]}
                options={[
                  { label: "Biologi", value: "Biologi" },
                  { label: "Fisika", value: "Fisika" },
                  { label: "Informatika", value: "Informatika" },
                  { label: "Kimia", value: "Kimia" },
                  { label: "Matematika", value: "Matematika" },
                  { label: "Statistika", value: "Statistika" },
                ]}
                placeholder=""
              />
            </Col>
            <Col
              span={24}
              lg={{
                span: 6,
                offset: 2,
              }}
              md={12}
              sm={24}
            >
              <ProFormDatePicker
                label={fieldLabels.tanggal_lulus}
                name="tanggal_lulus"
                tooltip="Tanggal bahwa Anda dinyatakan telah lulus"
                rules={[{ required: true, message: "Mohon diisi" }]}
                placeholder=""
              />
            </Col>
            <Col
              span={24}
              lg={{
                span: 6,
                offset: 2,
              }}
              md={12}
              sm={24}
            >
              <ProFormText
                label={fieldLabels.ipk}
                name="ipk"
                tooltip="Tuliskan IPK Anda sesuai Transkrip Terbaik pada akun SIAP"
                rules={[{ required: true, message: "Mohon diisi" }]}
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
            <Col span={24} lg={6} md={12} sm={24}>
              <ProFormSelect
                label={fieldLabels.nama_ketua_departemen}
                name="nama_ketua_departemen"
                tooltip="Nama dan Gelar Lengkap"
                rules={[{ required: true, message: "Mohon diisi" }]}
                placeholder=""
                options={daftarKetuaDepartemen?.map((dosen) => ({
                  label: dosen.name,
                  value: dosen.Pegawai.nip,
                }))}
                fieldProps={{
                  onChange: handleSelectKetuaDepartemen,
                }}
              />
            </Col>
            <Col span={24} lg={{ span: 6, offset: 2 }} md={12} sm={24}>
              <ProFormText
                label={fieldLabels.nip_ketua_departemen}
                name="nip_ketua_departemen"
                disabled
                tooltip="Silahkan lihat website Prodi Anda"
                rules={[{ required: true, message: "Mohon diisi" }]}
                placeholder=""
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
            <Col xl={6} lg={12} sm={24}>
              <p>
                <strong>File KTM</strong>
                <br />
                (Scan / foto / PDF Kartu Tanda Mahasiswa (KTM) yang masih aktif)
              </p>
              <Form.Item
                label="Upload KTM"
                required
                tooltip="JPG/PNG/PDF (maks 5MB)"
              >
                <Upload {...ktmUploadProps}>
                  <Button icon={<UploadOutlined />}>Select KTM</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col
              xl={{ span: 6, offset: 2 }}
              lg={{ span: 8 }}
              md={{ span: 12 }}
              sm={24}
            >
              <p>
                <strong>File Berita Acara Kelulusan</strong>
                <br />
                (Scan / foto / PDF berita acara kelulusan)
              </p>
              <Form.Item
                label="Upload Berita Acara Kelulusan"
                required
                tooltip="PDF (maks 100MB)"
              >
                <Upload {...BeritaAcaraKelulusanUploadProps}>
                  <Button icon={<UploadOutlined />}>
                    Select Berita Acara Kelulusan
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: "24px" }}>
            <Col xl={6} lg={12} sm={24}>
              <p>
                <strong>File Berita Acara Ujian Sarjana</strong>
                <br />
                (Scan / foto / PDF berita acara ujian sarjana)
              </p>
              <Form.Item
                label="Upload Berita Acara Ujian Sarjana"
                required
                tooltip="PDF (maks 100MB)"
              >
                <Upload {...BeritaAcaraUjianUploadProps}>
                  <Button icon={<UploadOutlined />}>
                    Select Berita Acara Ujian Sarjana
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col
              xl={{ span: 6, offset: 2 }}
              lg={{ span: 10 }}
              md={{ span: 12 }}
              sm={24}
            >
              <p>
                <strong>File Daftar Prestasi Akademik</strong>
                <br />
                (Scan / foto / PDF daftar prestasi akademik yang ditandatangani
                dekan)
              </p>
              <Form.Item
                label="Upload Daftar Prestasi Akademik"
                required
                tooltip="PDF (maks 100MB)"
              >
                <Upload {...DaftarPrestasiUploadProps}>
                  <Button icon={<UploadOutlined />}>
                    Select Daftar Prestasi Akademik
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <PopUpPengecekKelengkapanDataMahasiswa
          mahasiswaData={mahasiswa}
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onUpdate={handleUpdateClick}
          loading={loading}
        />
      </ProForm>
    </PageContainer>
  );
};

export default FormSKL;
