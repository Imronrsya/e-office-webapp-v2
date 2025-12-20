import { AxiosService } from "@/utils/axios";
import { UploadOutlined, EyeOutlined } from "@ant-design/icons";
import {
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
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
  Upload,
  UploadFile,
  UploadProps,
  Space,
  Spin,
} from "antd";
import React, { useRef, useState, useEffect } from "react";
import { Mahasiswa, SuratMasuk } from "@/utils/data";
import PopUpPengecekKelengkapanDataMahasiswa from "@/pages/components/PopUpPengecekKelengkapanDataMahasiswa";
import { checkIncompleteData } from "@/constant/step";
import useStyles from "../../../form/advanced-form/style.style";
import qs from "qs";
import { useFileUpload } from "../pengurangan-ukt/hooks/useFileUpload";

type InternalNamePath = (string | number)[];

interface StepDataType {
  nama: string;
  nim: string;
  program_studi: string;
  no_hp: string;
  nama_orang_tua: string;
  nip_pensiun_orang_tua: string;
  pangkat_golongan_orang_tua: string;
  instansi_orang_tua: string;
}

interface DetailData {
  nama?: string;
  nim?: string;
  program_studi?: string;
  no_hp?: string;
  nama_orang_tua?: string;
  nip_pensiun_orang_tua?: string;
  pangkat_golongan_orang_tua?: string;
  instansi_orang_tua?: string;
}

const fieldLabels = {
  nama: "Nama",
  nim: "NIM",
  program_studi: "Program Studi",
  no_hp: "No HP",
  nama_orang_tua: "Nama Orang Tua",
  nip_pensiun_orang_tua: "NIP/No. Pensiun Orang Tua",
  pangkat_golongan_orang_tua: "Pangkat/Golongan Orang Tua",
  instansi_orang_tua: "Instansi Orang Tua",
};

interface ErrorField {
  name: InternalNamePath;
  errors: string[];
}

const programStudiOptions = [
  { label: "Informatika", value: "Informatika" },
  { label: "Matematika", value: "Matematika" },
  { label: "Fisika", value: "Fisika" },
  { label: "Kimia", value: "Kimia" },
  { label: "Biologi", value: "Biologi" },
  { label: "Statistika", value: "Statistika" },
  { label: "Bioteknologi", value: "Bioteknologi" },
  { label: "Magister Matematika", value: "Magister Matematika" },
  { label: "Magister Biologi", value: "Magister Biologi" },
  { label: "Magister Kimia", value: "Magister Kimia" },
  { label: "Magister Fisika", value: "Magister Fisika" },
  {
    label: "Doktor Sains dan Matematika",
    value: "Doktor Sains dan Matematika",
  },
  { label: "Profesi Fisikawan Medik", value: "Profesi Fisikawan Medik" },
];

const REVISION_STATUSES = ["REVISI"];
const PENDING_STATUSES = [
  "MENUNGGU_LAMPIRAN_TANDA_TANGAN",
  "MENUNGGU_VERIFIKASI_DOSEN_PEMBIMBING",
  "MENUNGGU_VERIFIKASI_DOSEN_KOORDINATOR",
  "MENUNGGU_VERIFIKASI_KAPRODI",
  "MENUNGGU_VERIFIKASI_MANAJER_TU",
  "MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK",
  "MENUNGGU_VERIFIKASI_SUPERVISOR_SUMBERDAYA",
  "MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1",
  "MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK",
  "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_SUMBERDAYA",
  "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK",
  "SURAT_KELUAR_MENUNGGU_VERIFIKASI_MANAJER_TU",
  "SURAT_KELUAR_MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1",
  "DISETUJUI_SUPERVISOR_SUMBERDAYA", // KARENA ALUR AK006 LANGSUNG DISETUJUI SURAT MASUKNYA
  "PENOMORAN",
];

const FormSuratKeteranganMahasiswaTunjanganPNSBUMN: React.FC = () => {
  const { styles } = useStyles();
  const [error, setError] = useState<ErrorField[]>([]);
  const [fileKRSSemesterBerjalan, setFileKRSSemesterBerjalan] = useState<
    UploadFile[]
  >([]);
  const refFileKRS = useFileUpload();
  const refFileKTM = useFileUpload();
  const [fileKTM, setFileKTM] = useState<UploadFile[]>([]);
  const [listLampiran, setListLampiran] = useState<string[]>([]);
  const [existingApplication, setExistingApplication] = useState<SuratMasuk>();
  const [isRevisionNeeded, setIsRevisionNeeded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa>();
  const [nimMahasiswa, setNimMahasiswa] = useState("");

  const checkNIM = (input: string) => {
    const str6 = input?.substring(0, 6);
    switch (str6) {
      case "240101":
        return "Matematika";
      case "240401":
        return "Fisika";
      case "240501":
        return "Statistika";
      case "240301":
        return "Kimia";
      case "240201":
        return "Biologi";
      case "240202":
        return "Bioteknologi";
      case "240601":
        return "Informatika";
      default:
        return "Program Studi Tidak Ditemukan";
    }
  };

  const [stepData, setStepData] = useState<StepDataType>({
    nama: "",
    nim: "",
    program_studi: "",
    no_hp: "",
    nama_orang_tua: "",
    nip_pensiun_orang_tua: "",
    pangkat_golongan_orang_tua: "",
    instansi_orang_tua: "",
  });

  const formRef = useRef<FormInstance>();

  const handleUpdateClick = () => {
    window.location.href = "/mahasiswa/profile";
    setIsModalVisible(false);
  };

  const mapExistingApplicationToForm = (
    existingApplication: SuratMasuk | null,
  ): DetailData | null => {
    if (!existingApplication) {
      return null;
    }

    try {
      const parsedInfo: DetailData = JSON.parse(
        existingApplication.information || "{}",
      );

      const formData: DetailData = {
        nama: parsedInfo.nama || "",
        nim: parsedInfo.nim || "",
        program_studi: parsedInfo.program_studi || "",
        no_hp: parsedInfo.no_hp || "",
        nama_orang_tua: parsedInfo.nama_orang_tua || "",
        nip_pensiun_orang_tua: parsedInfo.nip_pensiun_orang_tua || "",
        pangkat_golongan_orang_tua: parsedInfo.pangkat_golongan_orang_tua || "",
        instansi_orang_tua: parsedInfo.instansi_orang_tua || "",
      };

      console.log("Form Data = ", formData);
      return formData;
    } catch (error) {
      console.error("Error mapping existing application:", error);
      return null;
    }
  };

  const getMahasiswa = async () => {
    setLoading(true);
    try {
      const axios = new AxiosService();
      const getMahasiswa: any = await axios.get("/v1/mahasiswa");

      console.log("/v1/mahasiswa = ", getMahasiswa.data.data);
      if (getMahasiswa) {
        const mahasiswaResponse = getMahasiswa.data as { data: Mahasiswa };
        const studentData = mahasiswaResponse.data;
        console.log(studentData);

        setMahasiswa(studentData);

        const defaultValues = {
          nama: studentData.user.name,
          nim: studentData.nim,
          program_studi: checkNIM(studentData.nim),
        };

        // Update stepData state
        setStepData((prev) => ({
          ...prev,
          ...defaultValues,
        }));

        // Set form values with a slight delay to ensure form is ready
        setTimeout(() => {
          formRef.current?.setFieldsValue(defaultValues);
        }, 100);

        const hasIncompleteData = checkIncompleteData(studentData);
        console.log("HAS = ", hasIncompleteData);

        if (hasIncompleteData) {
          setIsModalVisible(true);
        }
      }
    } catch (error) {
      console.error("Error getting mahasiswa:", error);
      message.error("Gagal memuat data mahasiswa");
    } finally {
      setLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const axios = new AxiosService();
      const getMahasiswa: any = await axios.get("/v1/role/mahasiswa");

      console.log("/v1/role/mahasiswa  = ", getMahasiswa.data.data);
      if (getMahasiswa && getMahasiswa.data.data.nim !== "") {
        const response: any = await axios.get(
          `/v1/pengajuan/pemohon/${getMahasiswa.data.data.nim}`,
        );
        setNimMahasiswa(getMahasiswa.data.data.nim);

        console.log("/v1/pengajuan/pemohon/  = ", response.data.data);
        if (response) {
          const responseData = response.data as { data: SuratMasuk[] };

          const pendingApp = responseData.data.find(
            (app: SuratMasuk) =>
              app.tipe_suratId === "ak006" &&
              PENDING_STATUSES.includes(app.status),
          );

          const revisionApp = responseData.data.find(
            (app: SuratMasuk) =>
              app.tipe_suratId === "ak006" &&
              REVISION_STATUSES.includes(app.status),
          );

          const result = revisionApp || pendingApp;
          setExistingApplication(result);

          if (revisionApp) {
            setIsRevisionNeeded(true);
          }

          if (result) {
            setCurrent(revisionApp ? 0 : 1);

            const mappedFormData = mapExistingApplicationToForm(result);
            if (mappedFormData) {
              setDetailData(mappedFormData);
              setTimeout(() => {
                formRef.current?.setFieldsValue(mappedFormData);
              }, 0);

              if (result.listLampiran) {
                const attachments = result.listLampiran.split(",");
                setListLampiran(attachments);

                attachments.forEach((attachment) => {
                  if (attachment.toLowerCase().includes("krs")) {
                    setFileKRSSemesterBerjalan([
                      {
                        uid: "-1",
                        name: "Existing KRS",
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
      message.error("Gagal memeriksa pengajuan yang sudah ada");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await checkExistingApplication();
      await getMahasiswa();
    };
    initializeData();
  }, []);

  const getUploadURL = () => {
    return (
      process.env.UMI_APP_PUBLIC_API_URL + "/v1/pengajuan/lampiran/upload"
    );
  };

  const MAX_MB = 10;

  const buildUploadProps = (
    currentList: UploadFile[],
    setCurrentList: React.Dispatch<React.SetStateAction<UploadFile[]>>,
    onUploaded?: (filename: string) => void,
  ): UploadProps => ({
    name: "file",
    maxCount: 1,
    fileList: currentList,
    action: getUploadURL(),
    withCredentials: true,
    method: "post",
    beforeUpload: (file) => {
      const isPDF = file.type === "application/pdf";
      const isLtMax = file.size / 1024 / 1024 <= MAX_MB;

      if (!isPDF) {
        message.error("Hanya file PDF yang diperbolehkan!");
        return Upload.LIST_IGNORE;
      }

      if (!isLtMax) {
        message.error(
          `Ukuran file harus kurang dari atau sama dengan ${MAX_MB} MB!`,
        );
        return Upload.LIST_IGNORE;
      }

      setCurrentList([file]);
      return true;
    },
    onChange(info) {
      if (info.file.status === "done") {
        const filename = info?.file?.response?.data?.filename;
        
        if (filename) {
          setListLampiran((prev) => [...prev, filename]);
          onUploaded?.(filename);
        }
        message.success(`${info.file.name} berhasil diupload`);
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} gagal diupload.`);
      }
    },
    onRemove: (file) => {
      setCurrentList([]);
      const fname = (file as any)?.response?.data?.filename;
      if (fname) {
        setListLampiran((prev) => prev.filter((x) => x !== fname));
      }
    },
  });

  const KRSUploadProps: UploadProps = buildUploadProps(
    fileKRSSemesterBerjalan,
    setFileKRSSemesterBerjalan,
  );

  const KTMUploadProps: UploadProps = buildUploadProps(fileKTM, setFileKTM);

  const handleNext = () => {
    setCurrent(current + 1);
  };

  const [getId, setGetID] = useState<string | undefined>(undefined);

  const handleSubmitForm = async (values: Record<string, any>) => {
    try {
      console.log(values);

      if (!isRevisionNeeded && !refFileKRS.uploadedFilenames.length) {
        message.error("Harap Upload Lampiran KRS Semester Berjalan");
        return;
      }

      if (!isRevisionNeeded && !refFileKTM.uploadedFilenames.length) {
        message.error("Harap Upload Lampiran KTM");
        return;
      }

      const formData = new FormData();
      formData.append("tipe_suratId", "ak006");
      formData.append("information", JSON.stringify(values));

      const extractFilename = (files: UploadFile[]) =>
        (files?.[0] as any)?.response?.data?.filename as string | undefined;
      const orderedLampiran: string[] = [];
      const krs = extractFilename(fileKRSSemesterBerjalan);
      if (krs) orderedLampiran.push(krs);
      const ktm = extractFilename(fileKTM);
      if (ktm) orderedLampiran.push(ktm);

      const lampirans: Array<{ label: string; file: string }> = [];

      lampirans.push({
        label: 'KRS',
        file: refFileKRS.uploadedFilenames[0]
      });

      lampirans.push({
        label: 'KTM',
        file: refFileKTM.uploadedFilenames[0]
      });

      formData.append('listLampiran', JSON.stringify(lampirans));
      

      const axios = new AxiosService();

      const data = qs.stringify({
        state_surat: JSON.stringify({
          nama: values.nama,
          nim: values.nim,
          program_studi: values.program_studi,
          noHP: values.no_hp,
          tanggal: "",
          log: [],
          namaorangtua: values.nama_orang_tua,
          nippensiunan: values.nip_pensiun_orang_tua,
          pangkatgolongan: values.pangkat_golongan_orang_tua,
          instansi: values.instansi_orang_tua,
        }),
      });

      if (isRevisionNeeded && existingApplication?.id) {
        try {
          const response = await axios.patch(
            `/v1/pengajuan/${existingApplication.id}`,
            formData,
          );

          await axios.patch(
            `/v1/pengajuan/${existingApplication.id}/changeStateSurat`,
            data,
            {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            },
          );

          setFileKRSSemesterBerjalan([]);
          setFileKTM([]);
          setListLampiran([]);
          handleNext();
          message.success("Form berhasil dikirim ulang");
        } catch (error) {
          console.error("Error updating application:", error);
          message.error("Gagal mengirim ulang form");
        }
      } else {
        try {
          const response = await axios.post(`/v1/pengajuan`, formData);

          if (
            response &&
            response.data &&
            response.data.data &&
            response.data.data.id
          ) {
            const id = response.data.data.id;
            console.log(response);
            setGetID(id);

            const data = qs.stringify({
              state_surat: JSON.stringify({
                nama: values.nama,
                nim: values.nim,
                program_studi: values.program_studi,
                noHP: values.no_hp,
                tanggal: "",
                log: [],
                namaorangtua: values.nama_orang_tua,
                nippensiunan: values.nip_pensiun_orang_tua,
                pangkatgolongan: values.pangkat_golongan_orang_tua,
                instansi: values.instansi_orang_tua,
              }),
            });

            console.log("DATA = ", data);

            await axios.patch(`/v1/pengajuan/${id}/changeStateSurat`, data, {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            setFileKRSSemesterBerjalan([]);
            setFileKTM([]);
            setListLampiran([]);
            handleNext();
            message.success(
              "Pengajuan Surat Pernyataan Masih Kuliah Berhasil Dikirim!",
            );
          } else {
            console.error(
              "Gagal mendapatkan ID pengajuan dari server:",
              response,
            );
            message.error(
              "Terjadi kesalahan pada server, ID pengajuan tidak diterima.",
            );
          }
        } catch (error) {
          console.error("Error creating application:", error);
          message.error("Gagal mengirim form");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("Gagal mengirim form");
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    setError(errorInfo.errorFields);
    message.error("Mohon lengkapi semua field yang diperlukan");
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

  const CustomSubmitter = ({ form }: any) => {
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

    if (existingApplication && !isRevisionNeeded) {
      return (
        <Space>
          <Button type="primary" onClick={handleNext}>
            Ke Halaman Selanjutnya
          </Button>
        </Space>
      );
    }

    return (
      <Button
        type="primary"
        onClick={async () => {
          try {
            // console.log("VALIDATING")
            await form?.validateFields();
            // console.log("VALIDATING")
            form?.submit();
          } catch (error) {
            console.error("Form validation failed:", error);
          }
        }}
      >
        Kirim
      </Button>
    );
  };

  return (
    <PageContainer style={{ width: "100%", padding: "0" }}>
      <StepsForm
        current={current}
        onCurrentChange={setCurrent}
        containerStyle={{ maxWidth: window.innerWidth > 900 ? "100%" : "100%" }}
        submitter={{
          render: (props) => {
            if (props.step === 0) {
              return <CustomSubmitter form={props.form} />;
            }
            return null;
          },
        }}
      >
        <StepsForm.StepForm<StepDataType>
          formRef={formRef}
          title="Isi Form Surat Keterangan Mahasiswa"
          initialValues={stepData}
          onFinish={handleSubmitForm}
          onFinishFailed={onFinishFailed}
          style={{
            maxWidth: window.innerWidth > 768 ? "100%" : "100%",
            padding: "0 8px",
            margin: "0",
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

          <div style={{ width: "100%", maxWidth: "none" }}>
            <Card
              className={styles.card}
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
                      opacity="0.1"
                    />
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
                      Berikut adalah panduan dan ketentuan dalam pengajuan Surat
                      Pernyataan Masih Kuliah:
                    </div>
                    <ol style={{ margin: "12px 0 0 18px", padding: 0 }}>
                      <li>
                        <b>Isi formulir dengan lengkap dan benar.</b> Pastikan
                        seluruh data mahasiswa dan data orang tua terisi sesuai
                        dengan dokumen resmi.
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
                            File KRS semester berjalan dalam format PDF,
                            maksimal 10 MB.
                          </li>
                          <li>
                            File KTM (Kartu Tanda Mahasiswa) dalam format PDF,
                            maksimal 10 MB.
                          </li>
                        </ul>
                      </li>
                      <li>
                        <b>Setelah mengirim formulir:</b> Pantau status
                        pengajuan Anda secara berkala di halaman dasbor.
                      </li>
                      <li>
                        <b>Proses verifikasi:</b> Pengajuan Anda akan
                        diverifikasi oleh pihak fakultas sesuai alur yang
                        berlaku.
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
            </Card>

            <Card
              className={styles.card}
              title="Data Mahasiswa"
              variant="borderless"
              style={{ marginBottom: 16, width: "100%" }}
            >
              <Row gutter={16}>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormText
                    label={fieldLabels.nama}
                    name="nama"
                    disabled={true}
                    rules={[{ required: true, message: "Mohon diisi" }]}
                    placeholder=""
                  />
                </Col>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormText
                    label={fieldLabels.nim}
                    name="nim"
                    disabled={true}
                    rules={[{ required: true, message: "Mohon diisi" }]}
                    placeholder=""
                  />
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormText
                    label={fieldLabels.program_studi}
                    name="program_studi"
                    rules={[{ required: true, message: "Mohon diisi" }]}
                    placeholder="Pilih Program Studi"
                    disabled={true}
                  />
                </Col>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormText
                    label={fieldLabels.no_hp}
                    name="no_hp"
                    rules={[
                      { required: true, message: "Mohon diisi" },
                      {
                        pattern:
                          /^(?:\+62|62|0)[\s\-()]*8[1-9](?:[\s\-()]*[0-9]){7,10}$/,
                        message: "Format nomor HP tidak valid",
                      },
                    ]}
                    placeholder="Contoh: 08123456789"
                    fieldProps={{
                      inputMode: "numeric",
                      onKeyPress: (e) => {
                        // Hanya izinkan angka dan tanda +
                        if (!/[0-9+]/.test(e.key)) {
                          e.preventDefault();
                        }
                      },
                      onPaste: (e) => {
                        // Filter paste content to only allow numbers and +
                        const paste = (
                          e.clipboardData || (window as any).clipboardData
                        ).getData("text");
                        if (!/^[0-9+]+$/.test(paste)) {
                          e.preventDefault();
                        }
                      },
                    }}
                  />
                </Col>
              </Row>
            </Card>

            <Card
              className={styles.card}
              title="Data Orang Tua"
              variant="borderless"
              style={{ marginBottom: 16, width: "100%" }}
            >
              <Row gutter={16}>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormText
                    label={fieldLabels.nama_orang_tua}
                    name="nama_orang_tua"
                    rules={[{ required: true, message: "Mohon diisi" }]}
                    placeholder="Masukkan nama lengkap orang tua"
                  />
                </Col>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormText
                    label={fieldLabels.nip_pensiun_orang_tua}
                    name="nip_pensiun_orang_tua"
                    rules={[{ required: true, message: "Mohon diisi" }]}
                    placeholder="Masukkan NIP atau nomor pensiun"
                  />
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormText
                    label={fieldLabels.pangkat_golongan_orang_tua}
                    name="pangkat_golongan_orang_tua"
                    rules={[{ required: true, message: "Mohon diisi" }]}
                    placeholder="Masukkan pangkat/golongan"
                  />
                </Col>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormText
                    label={fieldLabels.instansi_orang_tua}
                    name="instansi_orang_tua"
                    rules={[{ required: true, message: "Mohon diisi" }]}
                    placeholder="Masukkan nama instansi tempat bekerja"
                  />
                </Col>
              </Row>
            </Card>

            <Card
              className={styles.card}
              title="Upload Berkas"
              variant="borderless"
              style={{ marginBottom: 16, width: "100%" }}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <p>
                    <strong>Lampiran KRS Semester Berjalan</strong>
                    <br />
                    Format PDF maksimum size file 10 MB
                  </p>
                  <Form.Item
                    label="Upload KRS Semester Berjalan"
                    required={!isRevisionNeeded}
                    tooltip="File PDF maksimum size 10 MB"
                  >
                    <Upload {...refFileKRS.uploadProps}>
                      <Button icon={<UploadOutlined />}>Select File PDF</Button>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <p>
                    <strong>Lampiran KTM (Kartu Tanda Mahasiswa)</strong>
                    <br />
                    Format PDF maksimum size file 10 MB
                  </p>
                  <Form.Item
                    label="Upload KTM"
                    required={!isRevisionNeeded}
                    tooltip="File PDF maksimum size 10 MB"
                  >
                    <Upload {...refFileKTM.uploadProps}>
                      <Button icon={<UploadOutlined />}>Select File PDF</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>
        </StepsForm.StepForm>

        <StepsForm.StepForm
          title="Sedang Diproses"
          style={{
            maxWidth: window.innerWidth > 768 ? "100%" : "100%",
            margin: "0 auto",
            padding: "24px",
          }}
          onFinish={async (values) => {
            console.log("Form values:", values);
          }}
        >
          <Card style={{ width: "100%" }}>
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
                    Pengajuan Surat Pernyataan Masih Kuliah Anda sedang diproses
                    fakultas
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
                  const pengajuanId = getId || existingApplication?.id;

                  if (pengajuanId) {
                    window.location.href = `/persuratan-mahasiswa/surat/detail-pengajuan/${pengajuanId}`;
                  } else {
                    // Pengaman jika karena alasan tertentu ID tidak ditemukan
                    message.error(
                      "Gagal membuka halaman detail: ID pengajuan tidak ditemukan.",
                    );
                  }
                }}
              >
                Lihat Detail Pengajuan
              </Button>
            </div>
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

export default FormSuratKeteranganMahasiswaTunjanganPNSBUMN;
