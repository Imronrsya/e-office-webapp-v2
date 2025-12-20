import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormDatePicker,
  ProFormDateYearRangePicker,
  ProFormSelect,
  ProFormText,
} from "@ant-design/pro-components";
import {
  Card,
  Col,
  Popover,
  Row,
  message,
  UploadProps,
  UploadFile,
} from "antd";
import React, { useState } from "react";
import useStyles from "../../../form/advanced-form/style.style";
import { CloseCircleOutlined } from "@ant-design/icons";
import { AxiosService } from "@/utils/axios";

type InternalNamePath = (string | number)[];

const fieldLabels = {
  name: "Nama",
  nim: "NIM",
  tempat_lahir: "Tempat Lahir",
  tanggal_lahir: "Tanggal Lahir",
  alamat: "Alamat",
  kontak: "Kontak",

  departemen: "Departemen/Program Studi",
  semester: "Semester",
  tahun_akademik:
    "Tahun Akademik terdaftar sebagai Mahasiswa Fakultas Sains dan Matematika Universitas Diponegoro",
  nama_beasiswa: "Nama Beasiswa",

  prodi: "Prodi",
  jenjang: "Jenjang",

  tanggal: "Tanggal",
  bulan: "Bulan",
  tahun: "Tahun",
  ktm: "KTM",
};

const tableData = [
  {
    key: "1",
    workId: "00001",
    name: "John Brown",
    department: "New York No. 1 Lake Park",
  },
  {
    key: "2",
    workId: "00002",
    name: "Jim Green",
    department: "London No. 1 Lake Park",
  },
  {
    key: "3",
    workId: "00003",
    name: "Joe Black",
    department: "Sidney No. 1 Lake Park",
  },
];

interface ErrorField {
  name: InternalNamePath;
  errors: string[];
}

const suratKeteranganBeasiswa: React.FC<Record<string, any>> = () => {
  const { styles } = useStyles();
  const [error, setError] = useState<ErrorField[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const axios = new AxiosService();

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
      const key = err.name[0] as
        | "name"
        | "url"
        | "owner"
        | "approver"
        | "dateRange"
        | "type";
      return (
        <li
          key={key}
          className={styles.errorListItem}
          onClick={() => scrollToField(key)}
        >
          <CloseCircleOutlined className={styles.errorIcon} />
          <div className={styles.errorMessage}>{err.errors[0]}</div>
          <div className={styles.errorField}>{fieldLabels[key]}</div>
        </li>
      );
    });
    return (
      <span className={styles.errorIcon}>
        <Popover
          title="表单校验信息"
          content={errorList}
          overlayClassName={styles.errorPopover}
          trigger="click"
          getPopupContainer={(trigger: HTMLElement) => {
            if (trigger && trigger.parentNode) {
              return trigger.parentNode as HTMLElement;
            }
            return trigger;
          }}
        >
          <CloseCircleOutlined />
        </Popover>
        {errorCount}
      </span>
    );
  };

  const props: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([...fileList, file]);

      return false;
    },
    fileList,
  };

  const onFinish = async (values: Record<string, any>) => {
    setError([]);
    try {
      // console.log(values)
      const data = {
        pemohon: "24060121140151",
        tipe_suratId: "ak008",
        information: "{}",
      };
      await axios.post("/v1/pengajuan", data);
      // await fakeSubmitForm(values);
      message.success("Penambahan Surat berhasil");
    } catch (err: any) {
      console.log(err);
    }
  };
  const onFinishFailed = (errorInfo: any) => {
    setError(errorInfo.errorFields);
  };

  return (
    <ProForm
      layout="vertical"
      hideRequiredMark
      submitter={{
        render: (props, dom) => {
          return (
            <FooterToolbar>
              {getErrorInfo(error)}
              {dom}
            </FooterToolbar>
          );
        },
      }}
      initialValues={{
        members: tableData,
      }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <PageContainer>
        <p>
          Yth. Mahasiswa
          <br />
          Fakultas Sains dan Matematika Undip
          <br />
          Sehubungan dengan layanan permohonan surat keterangan beasiswa di
          Lingkungan Fakultas Sains dan Matematika Universitas Diponegoro,
          bersama ini diinformasikan kepada mahasiswa sebagai berikut :<br />
          1. Mahasiswa (Pemohon) mengisi lengkap formulir ini.
          <br />
          2. Setelah mengisi formulir dan submit, Silahkan anda cetak hasil
          input di form ini.
          <br />
          4. Silahkan proses Dokumen Surat Keterangan Beasiswa dengan
          tandatangan lengkap
          <br />
          5. Berkas Keterangan Beasiswa lengkap (ttd) beserta lampirannya
          dikumpulkan ke Halaman selanjutnya (tetap akan tersimpan)
          <br />
          6. Cek berkala halaman dasbor anda, apabila telah selesai dapat
          di-download
          <br />
          7. Selesai
          <br />
          Demikian, semoga bermanfaat.
          <br />
        </p>
        <Card
          title="Data Mahasiswa"
          className={styles.card}
          variant="borderless"
        >
          <Row gutter={16}>
            <Col lg={6} md={12} sm={24}>
              <ProFormText
                label={fieldLabels.name}
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
                name="tempat lahir"
                // tooltip="Anda saat ini semester berapa ?"
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
            <Col lg={6} md={12} sm={24}>
              <ProFormDatePicker
                label={fieldLabels.tanggal_lahir}
                name="tanggal lahir"
                // tooltip="Tuliskan jumlah SKS yang sudah anda tempuh hingga saat ini (cek di Transkrip Terbaik pada akun SIAP)"
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
              xl={{
                span: 6,
                offset: 2,
              }}
              lg={{
                span: 10,
              }}
              md={{
                span: 12,
              }}
              sm={24}
            >
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
          </Row>
        </Card>
        <Card
          title="Data Akademik"
          className={styles.card}
          variant="borderless"
        >
          <Row gutter={24}>
            <Col lg={12} md={12} sm={24}>
              <ProFormDateYearRangePicker
                label={fieldLabels.tahun_akademik}
                name="Tahun Akademik terdaftar sebagai Mahasiswa Fakultas Sains dan Matematika Universitas Diponegoro"
                //tooltip="Tanggal bahwa Anda dinyatakan telah lulus"
                rules={[
                  {
                    required: true,
                    message: "Mohon diisi",
                  },
                ]}
                placeholder=""
              />
            </Col>
            <Col lg={12} md={12} sm={24}>
              <ProFormSelect
                label={fieldLabels.departemen}
                name="Departemen/Program Studi"
                tooltip="Telah dinyatakan lulus ujian Sarjana pada Departemen/Program Studi"
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
          <Row gutter={24}>
            <Col lg={12} md={12} sm={24}>
              <ProFormText
                label={fieldLabels.semester}
                name="semester"
                tooltip="Semester Anda saat ini (tulis dengan angka)"
                rules={[
                  {
                    required: true,
                    message: "Mohon diisi",
                  },
                ]}
                placeholder=""
              />
            </Col>
            <Col lg={12} md={12} sm={24}>
              <ProFormText
                label={fieldLabels.nama_beasiswa}
                name="Nama Beasiswa"
                tooltip="Semester Anda saat ini (tulis dengan angka)"
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
      </PageContainer>
    </ProForm>
  );
};
export default suratKeteranganBeasiswa;
