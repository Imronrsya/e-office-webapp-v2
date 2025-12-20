import { AxiosService } from "@/utils/axios";
import { getCurrentStep } from "@/constant/step";
import EnhancedSteps from "@/pages/components/EnhanceStep";
import SPPTADetailDescriptions from "@/pages/components/SPPTADetailData";
import {
  UploadOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProFormList,
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
import useStyles from "../../../form/advanced-form/style.style";
import { Mahasiswa, User } from "@/utils/data";

// Extend SuratMasuk type to include 'information' property
type SuratMasuk = {
  id: string;
  tipe_suratId: string;
  status: string;
  keterangan_surat?: string;
  listLampiran?: string;
  information?: string; // <-- Add this property
  [key: string]: any;
};
import PopUpPengecekKelengkapanDataMahasiswa from "@/pages/components/PopUpPengecekKelengkapanDataMahasiswa";
import { checkIncompleteData } from "@/constant/step";
import qs from "qs";
import { spptaLampiranLabels } from "@/constants/labels";

type InternalNamePath = (string | number)[];

interface StepDataType {
  payAccount: string;
  receiverAccount: string;
  receiverName: string;
  amount: string;
  receiverMode: string;
}

interface DetailData {
  nama?: string;
  nim?: string;
  program_studi?: string;
  no_hp?: string;
  pengantar_untuk?: string;
  deskripsi?: string;
  deskripsi_tambahan?: Array<{ deskripsi: string }>;
  judul?: string;
  nama_dosen_pembimbing_1?: string;
  nip_dosen_pembimbing_1?: string;
  nama_dosen_pembimbing_2?: string;
  nip_dosen_pembimbing_2?: string;
}

const fieldLabels = {
  nama: "Nama",
  nim: "NIM",
  program_studi: "Program Studi",
  no_hp: "No HP",
  pengantar_untuk: "Pengantar Untuk",
  deskripsi: "Deskripsi Utama",
  deskripsi_tambahan: "Deskripsi Tambahan",
  judul: "Judul Skripsi/Tugas Akhir",
  nama_dosen_pembimbing_1: "Dosen Pembimbing 1",
  nip_dosen_pembimbing_1: "NIP Dosen Pembimbing 1",
  nama_dosen_pembimbing_2: "Dosen Pembimbing 2",
  nip_dosen_pembimbing_2: "NIP Dosen Pembimbing 2",
};

interface ErrorField {
  name: InternalNamePath;
  errors: string[];
}

// Daftar Program Studi - PERBAIKAN: Menambahkan lebih banyak opsi dan konsistensi
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

// PERBAIKAN: Konstanta untuk status yang memerlukan revisi
const REVISION_STATUSES = ["REVISI"];
const PENDING_STATUSES = [
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
];

const FormPerkembanganTugasAkhir: React.FC<Record<string, any>> = () => {
  const { styles } = useStyles();
  const [error, setError] = useState<ErrorField[]>([]);
  const [fileLampiranTugasAkhir, setFileLampiranTugasAkhir] = useState<
    UploadFile[]
  >([]);
  const [listLampiran, setListLampiran] = useState<string[]>([]);
  // Berkas Persyaratan tambahan
  const [fileSuratPermohonan, setFileSuratPermohonan] = useState<UploadFile[]>(
    [],
  );
  const [fileSuratKeteranganLulus, setFileSuratKeteranganLulus] = useState<
    UploadFile[]
  >([]);
  const [fileBuktiBayarUkt, setFileBuktiBayarUkt] = useState<UploadFile[]>([]);
  const [fileFotoBukuRekening, setFileFotoBukuRekening] = useState<
    UploadFile[]
  >([]);
  const [existingApplication, setExistingApplication] = useState<SuratMasuk>();
  const [isRevisionNeeded, setIsRevisionNeeded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa>();
  const [daftarDosenPembimbing, setDosenPembimbing] = useState<User[]>();
  const [kaprodi, setKaprodi] = useState({
    email: "",
    name: "",
    uuid: "",
    Pegawai: {
      createdAt: "",
      deletedAt: null,
      id_departemen: null,
      id_prodi: null,
      jabatan: "",
      nip: "",
      no_hp: "",
      updatedAt: "",
      uuid: "",
    },
    TandaTangan: [],
  });
  const [nimMahasiswa, setNimMahasiswa] = useState("");

  const checkNIM = (input: any) => {
    let str6 = input.substring(0, 6);
    let jurusandarinim;
    switch (str6) {
      case "240101":
        jurusandarinim = "Matematika";
        break;
      case "240401":
        jurusandarinim = "Fisika";
        break;
      case "240501":
        jurusandarinim = "Statistika";
        break;
      case "240301":
        jurusandarinim = "Kimia";
        break;
      case "240201":
        jurusandarinim = "Biologi";
        break;
      case "240202":
        jurusandarinim = "Bioteknologi";
        break;
      case "240601":
        jurusandarinim = "Informatika";
        break;
      default:
        jurusandarinim = "jurusantidakada";
        break;
    }
    return jurusandarinim;
  };

  const [stepData, setStepData] = useState<StepDataType>({
    payAccount: "ant-design@alipay.com",
    receiverAccount: "test@example.com",
    receiverName: "Alex",
    amount: "200",
    receiverMode: "alipay",
  });

  const formRef = useRef<FormInstance>();

  const handleUpdateClick = () => {
    window.location.href = "/persuratan-mahasiswa/mahasiswa/profile";
    setIsModalVisible(false);
  };


  // Muat daftar dosen pembimbing (role 21) untuk mapping opsional
  const getDosenPembimbing = async () => {
    try {
      const axios = new AxiosService();
      const res: any = await axios.get("/v1/pegawai/21");
      console.log("/v1/pegawai/21 = ", res.data.data);

      // PENAMBAHAN PATH !!! DEPARTEMEN

      const getMahasiswa: any = await axios.get("/v1/mahasiswa");

      console.log("/v1/mahasiswa = ", getMahasiswa.data.data.nim);
      const nimMaha = getMahasiswa.data.data.nim;
      const str6 = nimMaha.substring(0, 6);
      // console.log("NIM = ", nimMaha)
      // console.log("join = ", str6)

      // if ( nimMahasiswa ){

      // }

      const reso: any = await axios.get(`/v1/pegawai/prodi/23/${str6}`);
      console.log("/v1/pegawai/23 = ", reso.data.data);
      // Ambil kaprodi pertama dari array karena endpoint mengembalikan array
      const kaprodiData =
        Array.isArray(reso.data.data) && reso.data.data.length > 0
          ? reso.data.data[0]
          : {
            email: "",
            name: "",
            uuid: "",
            Pegawai: {
              createdAt: "",
              deletedAt: null,
              id_departemen: null,
              id_prodi: null,
              jabatan: "",
              nip: "",
              no_hp: "",
              updatedAt: "",
              uuid: "",
            },
            TandaTangan: [],
          };
      setKaprodi(kaprodiData);
      if (res?.data?.data) setDosenPembimbing(res.data.data as User[]);
    } catch (error) {
      console.error("Error getting dosen pembimbing:", error);
      message.error("Gagal memuat daftar dosen pembimbing");
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

        // PERBAIKAN: Set nilai default yang konsisten
        const defaultValues = {
          nama: studentData.user.name,
          nim: studentData.nim,
          program_studi:
            (studentData as any).prodi?.nama_prodi ||
            (studentData as any).prodi,
          pengantar_untuk: "Surat Pengantar Perkembangan Tugas Akhir",
        };

        formRef.current?.setFieldsValue(defaultValues);

        // Check if any required field is missing
        const hasIncompleteData = checkIncompleteData(studentData);
        console.log("HAS = ", hasIncompleteData);

        // Only show popup if data is incomplete
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
          // Type assertion to avoid 'unknown' error
          const responseData = response.data as { data: SuratMasuk[] };

          // PERBAIKAN: Menggunakan konstanta yang sudah didefinisikan
          const pendingApp = (response.data.data as SuratMasuk[]).find(
            (app: SuratMasuk) =>
              app.tipe_suratId === "sppta" &&
              PENDING_STATUSES.includes(app.status),
          );

          // Check for applications that need revision
          // const revisionApp = (response.data.data as SuratMasuk[]).find(
          const revisionApp = responseData.data.find(
            (app: SuratMasuk) =>
              app.tipe_suratId === "sppta" &&
              REVISION_STATUSES.includes(app.status),
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

            // const mappedFormData = mapExistingApplicationToForm(result);
            // if (mappedFormData) {
            //     setDetailData(mappedFormData);
            //     // Set the form values using formRef after component is mounted
            //     setTimeout(() => {
            //         formRef.current?.setFieldsValue(mappedFormData);
            //     }, 0);

            //     // If there are existing attachments, set them
            //     if (result.listLampiran) {
            //         const attachments = result.listLampiran.split(',');
            //         setListLampiran(attachments);

            //         // Map existing attachments to file lists if needed
            //         attachments.forEach((attachment: string, index: number) => {
            //             if (attachment.toLowerCase().includes('tugas') || attachment.toLowerCase().includes('akhir')) {
            //                 setFileLampiranTugasAkhir([
            //                     {
            //                         uid: `existing-${index}`,
            //                         name: 'Existing Tugas Akhir',
            //                         status: 'done',
            //                         url: attachment,
            //                     },
            //                 ]);
            //             }
            //         });
            //     }
            // }
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
      await getDosenPembimbing();
    };
    initializeData();
  }, []);

  // PERBAIKAN: Upload Props dengan environment variable untuk URL
  const getUploadURL = () => {
    // Ganti dengan environment variable atau konfigurasi yang sesuai
    return (
      process.env.UMI_APP_PUBLIC_API_URL + "/v1/pengajuan/lampiran/upload"
    );
    }
  };

  const MAX_MB = 10; // batas 10MB sesuai ketentuan

  const buildUploadProps = (
    currentList: UploadFile[],
    setCurrentList: React.Dispatch<React.SetStateAction<UploadFile[]>>,
    onUploaded?: (filename: string) => void,
  ): UploadProps => ({
    name: "file",
    maxCount: 1,
    fileList: currentList,
    action: getUploadURL(),
    method: "post",
    withCredentials: true,
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
      // hapus dari state file list
      setCurrentList([]);
      // jika sudah pernah masuk ke listLampiran, hapus juga
      const fname = (file as any)?.response?.data?.filename;
      if (fname) {
        setListLampiran((prev) => prev.filter((x) => x !== fname));
      }
    },
  });

  // UploadProps spesifik
  const lampiranUploadProps: UploadProps = buildUploadProps(
    fileLampiranTugasAkhir,
    setFileLampiranTugasAkhir,
  );

  const suratPermohonanUploadProps: UploadProps = buildUploadProps(
    fileSuratPermohonan,
    setFileSuratPermohonan,
  );

  const suratKeteranganLulusUploadProps: UploadProps = buildUploadProps(
    fileSuratKeteranganLulus,
    setFileSuratKeteranganLulus,
  );

  const buktiBayarUktUploadProps: UploadProps = buildUploadProps(
    fileBuktiBayarUkt,
    setFileBuktiBayarUkt,
  );

  const fotoBukuRekeningUploadProps: UploadProps = buildUploadProps(
    fileFotoBukuRekening,
    setFileFotoBukuRekening,
  );

  const handleNext = () => {
    setCurrent(current + 1);
  };

  const [getId, setGetID] = useState<string | undefined>(undefined);

  const handleSubmitForm = async (values: Record<string, any>) => {
    try {
      console.log(values);

      const stringifyToParse1 = values?.pembimbing1_uuid;
      const stringifyToParse2 = values?.pembimbing2_uuid;

      // Validasi pilihan pembimbing (jika diisi tidak boleh sama)
      // CATATAN: Pemilihan pembimbing adalah OPSIONAL
      // Jika tidak dipilih, pengajuan akan diteruskan ke Dosen Koordinator terlebih dahulu
      if (stringifyToParse1 && stringifyToParse2) {
        if (
          JSON.parse(stringifyToParse1).uuid ===
          JSON.parse(stringifyToParse2).uuid
        ) {
          message.error("Pembimbing 1 dan Pembimbing 2 tidak boleh sama");
          return;
        }
      }

      if (!stringifyToParse1 && stringifyToParse2) {
        message.error(
          "Harap pilih Pembimbing 1 terlebih dahulu sebelum memilih Pembimbing 2",
        );
        return;
      }

      // Validasi file upload untuk pengajuan baru
      if (!isRevisionNeeded && !fileLampiranTugasAkhir.length) {
        message.error("Harap Upload Lampiran Tugas Akhir");
        return;
      }

      const formData = new FormData();
      formData.append("tipe_suratId", "sppta");
      formData.append("information", JSON.stringify(values));

      // Mapping pembimbing (opsional): jika mahasiswa memilih pembimbing, langsung kirim UUID-nya
      if (stringifyToParse1) {
        formData.append("pembimbing1_uuid", JSON.parse(stringifyToParse1).uuid);
        if (stringifyToParse2) {
          formData.append(
            "pembimbing2_uuid",
            JSON.parse(stringifyToParse2).uuid,
          );
        }
      }

      // Susun daftar lampiran secara deterministik sesuai urutan field di form
      const extractFilename = (files: UploadFile[]) =>
        (files?.[0] as any)?.response?.data?.filename as string | undefined;


      console.log(fileLampiranTugasAkhir)
      console.log(fileSuratPermohonan)
      console.log(fileSuratKeteranganLulus)
      console.log(fileBuktiBayarUkt)
      console.log(fileFotoBukuRekening)

      const lampiransToSend: any[] = [];
      if (fileLampiranTugasAkhir.length) lampiransToSend.push({
        label: spptaLampiranLabels[0],
        file: fileLampiranTugasAkhir[0].name
      });
      if (fileSuratPermohonan.length) lampiransToSend.push({
        label: spptaLampiranLabels[1],
        file: fileSuratPermohonan[0].name
      });
      if (fileSuratKeteranganLulus.length) lampiransToSend.push({
        label: spptaLampiranLabels[2],
        file: fileSuratKeteranganLulus[0].name
      });
      if (fileBuktiBayarUkt.length) lampiransToSend.push({
        label: spptaLampiranLabels[3],
        file: fileBuktiBayarUkt[0].name
      });
      if (fileFotoBukuRekening.length) lampiransToSend.push({
        label: spptaLampiranLabels[4],
        file: fileFotoBukuRekening[0].name
      });
      
      console.log("lampiransToSend")
      console.log(lampiransToSend)

      formData.append(
        "listLampiran", JSON.stringify(lampiransToSend)
      )



      const axios = new AxiosService();
      console.log("Kaprodi => ", kaprodi);

      const data = qs.stringify({
        state_surat: JSON.stringify({
          nama: values.nama,
          nim: values.nim,
          program_studi: values.program_studi,
          noHP: values.no_hp,
          judul: values.judul,
          tanggal: "",
          checkProgress: {
            bab1: "",
            bab2: "",
            bab3: "",
            bab4: "",
            bab5: "",
          },
          log: [],
          dosen: {
            pembimbing1: {
              nama:
                stringifyToParse1 !== undefined
                  ? JSON.parse(stringifyToParse1).nama
                  : "",
              nip:
                stringifyToParse1 !== undefined
                  ? JSON.parse(stringifyToParse1).nip
                  : "",
              program_studi:
                stringifyToParse1 !== undefined
                  ? JSON.parse(stringifyToParse1).program_studi
                  : "",
              noHP:
                stringifyToParse1 !== undefined
                  ? JSON.parse(stringifyToParse1).no_hp
                  : "",
              ttd: "",
            },
            pembimbing2: {
              nama:
                stringifyToParse2 !== undefined
                  ? JSON.parse(stringifyToParse2).nama
                  : "",
              nip:
                stringifyToParse2 !== undefined
                  ? JSON.parse(stringifyToParse2).nip
                  : "",
              program_studi:
                stringifyToParse2 !== undefined
                  ? JSON.parse(stringifyToParse2).program_studi
                  : "",
              noHP:
                stringifyToParse2 !== undefined
                  ? JSON.parse(stringifyToParse2).no_hp
                  : "",
              ttd: "",
            },
            kaprodi: {
              nama: kaprodi?.name || "",
              nip: kaprodi?.Pegawai?.nip || "",
              program_studi: kaprodi?.Pegawai?.id_prodi
                ? String(kaprodi.Pegawai.id_prodi)
                : "",
              noHP: kaprodi?.Pegawai?.no_hp || "",
              ttd: "",
            },
          },
        }),
      });

      // If revision needed, use PATCH to update existing application
      // if (isRevisionNeeded && existingApplication?.id) {
      //     // response = await axios.patch(`/v1/pengajuan/${existingApplication.id}`, formData);

      //     axios.patch(`/v1/pengajuan/${existingApplication.id}`, formData)
      //         .then((response) => {
      //             // console.log(response);
      //             // const id = (response.data as { data: { id: string } }).data.id;
      //             // setGetID(id)

      //             axios.patch(`/v1/pengajuan/${existingApplication.id}/changeStateSurat`, data, {headers: {'Content-Type': 'application/x-www-form-urlencoded' }}).then((res) => {
      //                 console.log(res)
      //                 // Reset form state
      //                 setFileLampiranTugasAkhir([]);
      //                 setListLampiran([]);

      //                 // Move to next step
      //                 handleNext();
      //             }).catch((error) => {
      //                 console.log(error);
      //             })

      //         })
      //         .catch((error) => {
      //             console.log(error);
      //         });

      //     message.success('Form berhasil dikirim ulang');
      // } else {
      // Otherwise, create new application
      axios
        .post(`/v1/pengajuan`, formData)
        .then((response) => {
          // console.log(response);
          const id = (response.data as { data: { id: string } }).data.id;
          setGetID(id);

          axios
            .patch(`/v1/pengajuan/${id}/changeStateSurat`, data, {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            })
            .then((res) => {
              // console.log(res);
              // Reset form state
              setFileLampiranTugasAkhir([]);
              setFileSuratPermohonan([]);
              setFileSuratKeteranganLulus([]);
              setFileBuktiBayarUkt([]);
              setFileFotoBukuRekening([]);
              setListLampiran([]);

              // Move to next step
              handleNext();
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch((error) => {
          console.log(error);
        });

      message.success(
        "Pengajuan Surat Pengantar Perkembangan Tugas Akhir Berhasil Dikirim!",
      );
      // }
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

  const CustomSubmitter = ({ form, onSubmit }: any) => {
    // If revision needed, show the "Kirim Ulang" button
    // if (isRevisionNeeded) {
    //     return (
    //         <Button
    //             type="primary"
    //             onClick={async () => {
    //                 try {
    //                     await form?.validateFields();
    //                     form?.submit();
    //                 } catch (error) {
    //                     console.error('Form validation failed:', error);
    //                 }
    //             }}
    //         >
    //             Kirim Ulang
    //         </Button>
    //     );
    // }

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
          render: (props, _dom) => {
            if (props.step === 0) {
              return (
                <CustomSubmitter form={props.form} onSubmit={props.onSubmit} />
              );
            }
            return null;
          },
        }}
      >
        <StepsForm.StepForm<StepDataType>
          formRef={formRef}
          title="Isi Form Surat Pengantar Perkembangan Tugas Akhir"
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
            RevisionCard(existingApplication)
          )}

          <div style={{ width: "100%", maxWidth: "none" }}>
            {InformationCard}

            <Card
              title="Data Mahasiswa"
              className={styles.card}
              variant="borderless"
              style={{ marginBottom: 16, width: "100%" }}
            >
              <Row gutter={16}>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormText
                    label={fieldLabels.nama}
                    name="nama"
                    initialValue={mahasiswa?.user.name}
                    disabled={true}
                    rules={[{ required: true, message: "Mohon diisi" }]}
                    placeholder=""
                  />
                </Col>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormText
                    label={fieldLabels.nim}
                    name="nim"
                    initialValue={mahasiswa?.nim}
                    disabled={true}
                    rules={[{ required: true, message: "Mohon diisi" }]}
                    placeholder=""
                  />
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormSelect
                    label={fieldLabels.program_studi}
                    name="program_studi"
                    // initialValue={(mahasiswa as any)?.prodi?.nama_prodi || (mahasiswa as any)?.prodi}
                    initialValue={checkNIM(mahasiswa?.nim)}
                    rules={[{ required: true, message: "Mohon dipilih" }]}
                    options={programStudiOptions}
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
                  />
                </Col>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormText
                    label={fieldLabels.pengantar_untuk}
                    name="pengantar_untuk"
                    initialValue="Surat Pengantar Perkembangan Tugas Akhir"
                    disabled={true}
                    rules={[{ required: true, message: "Mohon diisi" }]}
                    placeholder=""
                  />
                </Col>
                <Col span={24} lg={12} md={12} sm={24}>
                  <ProFormText
                    label={fieldLabels.judul}
                    name="judul"
                    tooltip="Tuliskan judul lengkap tugas akhir Anda"
                    rules={[{ required: true, message: "Mohon diisi" }]}
                    placeholder="Masukkan judul tugas akhir"
                  />
                </Col>
              </Row>
            </Card>

            <Card
              title="Upload Berkas"
              className={styles.card}
              variant="borderless"
              style={{ marginBottom: 16, width: "100%" }}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <p>
                    <strong>Lampiran Tugas Akhir</strong>
                    <br />
                    Format PDF maksimum size file 10 MB
                  </p>
                  <Form.Item
                    label="Upload Tugas Akhir"
                    required={!isRevisionNeeded}
                    tooltip="File PDF maksimum size 10 MB"
                  >
                    <Upload {...lampiranUploadProps}>
                      <Button icon={<UploadOutlined />}>Select File PDF</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Berkas Persyaratan Tambahan */}
            <Card
              title="Berkas Persyaratan"
              className={styles.card}
              variant="borderless"
              style={{ marginBottom: 16, width: "100%" }}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <p>
                    Unggah keempat berkas persyaratan berikut (PDF, maks 10 MB
                    per berkas). Semua berkas akan disertakan sebagai lampiran
                    pengajuan.
                  </p>
                </Col>
                <Col span={24} lg={12} md={12} sm={24}>
                  <Form.Item label="Surat Permohonan (WR II)">
                    <Upload {...suratPermohonanUploadProps}>
                      <Button icon={<UploadOutlined />}>Pilih PDF</Button>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col span={24} lg={12} md={12} sm={24}>
                  <Form.Item label="Surat Keterangan Lulus">
                    <Upload {...suratKeteranganLulusUploadProps}>
                      <Button icon={<UploadOutlined />}>Pilih PDF</Button>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col span={24} lg={12} md={12} sm={24}>
                  <Form.Item label="Bukti Bayar UKT Semester Ini">
                    <Upload {...buktiBayarUktUploadProps}>
                      <Button icon={<UploadOutlined />}>Pilih PDF</Button>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col span={24} lg={12} md={12} sm={24}>
                  <Form.Item label="Foto Buku Rekening">
                    <Upload {...fotoBukuRekeningUploadProps}>
                      <Button icon={<UploadOutlined />}>Pilih PDF</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {newFunction(styles, daftarDosenPembimbing, formRef)}
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

export default FormPerkembanganTugasAkhir;



