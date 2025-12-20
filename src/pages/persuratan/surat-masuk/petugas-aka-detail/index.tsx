import { AxiosService } from '@/utils/axios';
import { SignerOption, SuratMasuk } from '@/utils/data';
import {
  DownloadOutlined,
  EyeOutlined,
  FileOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { PDFViewer } from '@react-pdf/renderer';

import DownloadDOCXSuratPengantarAK15 from '../../akademik/pkl/docx';

import { getCurrentStep } from '@/constant/step';
import AK15DetailDescriptions from '@/pages/components/AK15DetailData';
import AK8DetailDescriptions from '@/pages/components/AK8DetailData';
import { CommentsSection, ProgressSection } from '@/pages/components/CommentandProgress';
import EnhancedSteps from '@/pages/components/EnhanceStep';
import { formatTanggal } from '@/pages/components/FormatTanggalUmumIndo';
import SRBDetailDescriptions from '@/pages/components/SRBDetailData';
import { getStatusTag } from '@/pages/components/StatusTag';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useNavigate, useParams } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
  UploadFile,
  UploadProps,
} from 'antd';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline as UnderlineIcon,
} from 'lucide-react';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import SuratPengantarAK15 from '../../akademik/pkl/pdf/SuratPengantar';
import SuratRekomendasiBeasiswa from '../../akademik/surat-rekomendasi-beasiswa/pdf/SuratRekomendasi';
import { ResponsiveSpace } from '../../surat-masuk/detail';

const { Title } = Typography;
const { TextArea } = Input;

interface DispositionDetail {
  id: number;
  nip: string;
  id_surat: number;
  keterangan: string;
  status: string;
  createdAt: string;
}

const SuratKeluarCreate: React.FC = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispositionDetail, setDispositionDetail] = useState<DispositionDetail | null>(null);
  const [suratMasukDetail, setSuratMasukDetail] = useState<SuratMasuk>();
  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [signers, setSigners] = useState<SignerOption[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalPDFloadVisible, setIsModalPDFVisible2] = useState(false);
  const [previewFormData, setPreviewFormData] = useState<any>(null);

  const [fileSuratKeluar, setFileSuratKeluar] = useState<UploadFile[]>([]);
  const [listLampiran, setListLampiran] = useState<string[]>([]);

  const suratKeluarUploadProps: UploadProps = {
    name: 'file',
    maxCount: 1,
    action:
      process.env.UMI_APP_PUBLIC_API_URL + "/v1/pengajuan/lampiran/upload",
    method: 'post',
    fileList: fileSuratKeluar,
    beforeUpload: (file) => {
      const isPDF = file.type === 'application/pdf';
      const isDOCX =
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.toLowerCase().endsWith('.docx');
      const isAllowed = isPDF || isDOCX;
      const isLt100M = file.size / 1024 / 1024 < 100;

      if (!isAllowed) {
        message.error('You can only upload PDF or DOCX files!');
        return Upload.LIST_IGNORE;
      }

      if (!isLt100M) {
        message.error('File must be smaller than 100MB!');
        return Upload.LIST_IGNORE;
      }

      setFileSuratKeluar([file]);
      return true;
    },
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        setListLampiran([...listLampiran, info.file.response.data.location]);
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onRemove: () => {
      setFileSuratKeluar([]);
    },
  };


  const MenuBar: React.FC<{ editor: any }> = ({ editor }) => {
    if (!editor) {
      return null;
    }

    return (
      <div className="border-b border-gray-200 p-2 mb-2 flex gap-2">
        <Button
          type="text"
          size="small"
          icon={<Bold className={editor.isActive('bold') ? 'text-blue-500' : ''} size={18} />}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <Button
          type="text"
          size="small"
          icon={<Italic className={editor.isActive('italic') ? 'text-blue-500' : ''} size={18} />}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <Button
          type="text"
          size="small"
          icon={
            <UnderlineIcon
              className={editor.isActive('underline') ? 'text-blue-500' : ''}
              size={18}
            />
          }
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <Divider type="vertical" />
        <Button
          type="text"
          size="small"
          icon={
            <AlignLeft
              className={editor.isActive({ textAlign: 'left' }) ? 'text-blue-500' : ''}
              size={18}
            />
          }
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        />
        <Button
          type="text"
          size="small"
          icon={
            <AlignCenter
              className={editor.isActive({ textAlign: 'center' }) ? 'text-blue-500' : ''}
              size={18}
            />
          }
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        />
        <Button
          type="text"
          size="small"
          icon={
            <AlignRight
              className={editor.isActive({ textAlign: 'right' }) ? 'text-blue-500' : ''}
              size={18}
            />
          }
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        />
      </div>
    );
  };

  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class: 'prose max-w-full p-4 border rounded-md min-h-[200px] focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      form.setFieldValue('isi_surat', editor.getHTML());
    },
  });

  const handleCancelPDF = () => {
    setIsModalPDFVisible2(false);
  };

  const fetchDispositionDetail = async () => {
    try {
      setLoading(true);
      const axios = new AxiosService();
      const pengajuanResponse = await axios.get<any>(`/v1/pengajuan/${id}`);
      if (pengajuanResponse) {
        setSuratMasukDetail(pengajuanResponse.data.data);
        setDetailData(JSON.parse(pengajuanResponse.data.data.information));
      }
    } catch (error) {
      message.error('Gagal mengambil detail disposisi');
    } finally {
      setLoading(false);
    }
  };

  const fetchSigners = async () => {
    try {
      const axios = new AxiosService();
      // masih bisa berubah
      const response = await axios.post('/v1/pegawai/daftar-pegawai', { roles: [5, 6, 7] });
      if (response && response.data) {
        setSigners(response.data.data);
      }
    } catch (error) {
      message.error('Gagal mengambil data penanda tangan');
    }
  };

  useEffect(() => {
    fetchDispositionDetail();
    fetchSigners();
  }, []);
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const axios = new AxiosService(); // Kondisi untuk AK15 (Surat Pengantar PKL)      if (suratMasukDetail?.tipe_suratId === 'ak15') {
      const result = await axios.post('/v1/pengajuan/surat-keluar', {
        ...values,
        id_surat_masuk: id ? parseInt(id) : 0,
        tanggal_surat: values.tanggal_surat.format('YYYY-MM-DD'),
        listLampiran: listLampiran.toString(),
      });

      if (result) {
        // Navigate to detail action page with correct state
        navigate(`/surat-masuk/petugas-akademik/action/${id}`, {
          state: {
            id: id,
            status: 'DISETUJUI',
            role: 'PETUGAS_AKADEMIK',
            message: 'Surat Pengantar PKL berhasil dibuat',
            data: result.data,
          },
        });
      }
      // Kondisi untuk AK8 (SKL)
      else if (suratMasukDetail?.tipe_suratId === 'ak8') {
        const result = await axios.patch(`/v1/pengajuan/${id}/changeStatus`, {
          status: 'DISETUJUI',
          role: 9,
          roleTujuan: 1,
          keterangan: values.keterangan,
        });
        message.success('Surat Berhasil Diubah Status Menjadi Dicetak');
      }
      // Kondisi untuk SRB (Surat Rekomendasi Beasiswa)
      else if (suratMasukDetail?.tipe_suratId === 'srb') {
        const dataToSend = {
          ...values,
          id_surat_masuk: suratMasukDetail?.id,
          tanggal_surat: values.tanggal_surat.format('YYYY-MM-DD'),
          lampiran: '-',
          hal: 'Pengajuan Surat Rekomendasi Beasiswa',
          tujuan_surat: '-',
          tembusan: ['-'],
          isi_surat: values.isi_surat,
          pemberi_tanda_tangan: values.pemberi_tanda_tangan,
        };

        // Tambahkan id_disposisi jika ada
        if (dispositionDetail?.id) {
          dataToSend.id_disposisi = dispositionDetail.id;
        }

        await axios.post('/v1/pengajuan/surat-keluar', dataToSend);
        message.success('Surat Rekomendasi Beasiswa berhasil dibuat');
      } else {
        console.log('Unknown letter type:', suratMasukDetail?.tipe_suratId);
        message.error('Tipe surat tidak dikenal');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      message.error('Gagal membuat surat keluar');
    } finally {
      setLoading(false);
    }
    fetchDispositionDetail();
    fetchSigners();
  };

  const isiSuratDefault = (
    pengatar_untuk: string,
    jenjang: string,
    prodi: string,
    departemen: string,
    nama: string,
    nim: string,
    judul: string,
  ) => {
    return `<p>Sehubungan dengan kegiatan ${pengatar_untuk} mahasiswa Program Studi ${jenjang} ${prodi} Departemen ${departemen} Fakultas Sains dan Matematika Universitas Diponegoro tersebut di bawah ini:</p>
<p>Nama&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${nama}</p>
<p>NIM&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${nim}</p>
<p>Judul&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${judul}</p>
<p>dengan ini mohon diizinkan bagi mahasiswa tersebut untuk melaksanakan ${pengatar_untuk} di Instansi Saudara. </p>
<p>Segala persyaratan dan konsekuensi yang ada menjadi tanggung jawab mahasiswa yang bersangkutan.</p>
<p>Atas perhatian Saudara kami ucapkan terimakasih.</p>`;
  };

  const isiTujuanSuratPkl = (
    tujuan_surat: string,
    jabatan: string,
    instansi: string,
    alamat_instansi: string,
  ) => {
    return `<p>Yth.  ${tujuan_surat} <br /> ${jabatan}<br /> ${instansi}<br /> ${alamat_instansi}</p>`;
  };


  const isiSuratRekomendasiBeasiswa = (
    nama: string,
    nim: string,
    tempat_lahir: string,
    tanggal_lahir: string,
    kontak: string,
    tahun_akademik: string,
    Jurusan: string,
    semester: string,
    IPK: string,
    IPS: string,
    nama_beasiswa: string,
  ) => {
    const tahunAkademik = detailData.tahun_akademik;
    let formattedTahunAkademik = 'N/A';
    if (Array.isArray(tahunAkademik) && tahunAkademik.length === 2) {
      const [startDate, endDate] = tahunAkademik;
      const startYear = moment(startDate).year();
      const endYear = moment(endDate).year();
      formattedTahunAkademik = `${startYear}/${endYear}`;
    }

    return `<p>Dekan Fakultas Sains dan Matematika Universitas Diponegoro dengan ini menerangkan: </p>
  <p>
      Nama&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${nama}<br/>
      NIM&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${nim}<br/>
      Tempat/Tgl Lahir&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${tempat_lahir}, ${tanggal_lahir}<br/>
      No HP&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${kontak}<br/>
  </p>
  <p>Pada tahun akademik ${formattedTahunAkademik} terdaftar sebagai mahasiswa Fakultas Sains dan Matematika Universitas Diponegoro</p>
  <p>
      Jurusan&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${Jurusan}<br/>
      Semester&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${semester}<br/>
      IPK&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${IPK}<br/>
      IPS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${IPS}<br/>
  </p>
  <p>
  Surat rekomendasi ini dibuat untuk keperluan : Pengajuan Beasiswa ${nama_beasiswa}<br/>
  Serta menerangkan bahwa mahasiswa yang bersangkutan:<br/>
  </p>
  <p>
  - Tidak sedang mengajukan atau menerima beasiswa dari instansi lain<br/>
  - Berstatus aktif kuliah<br/>
  - Berkelakuan baik<br/>
  </p>
  <p>Demikian untuk diketahui dan dipergunakan sebagaimana mestinya.</p>`;
  };

  useEffect(() => {
    if (editor && detailData) {
      const defaultContent =
        suratMasukDetail?.tipe_suratId === 'srb'
          ? isiSuratRekomendasiBeasiswa(
            detailData.nama,
            detailData.nim,
            detailData.tempat_lahir,
            detailData.tanggal_lahir,
            detailData.kontak,
            detailData.tahun_akademik,
            detailData.Jurusan || detailData.jurusan || detailData.Departemen,
            detailData.semester,
            detailData.IPK,
            detailData.IPS,
            detailData.nama_beasiswa,
          )
          : isiSuratDefault(
            detailData.pengatar_untuk,
            detailData.jenjang,
            detailData.Prodi,
            detailData.Departemen,
            detailData.nama,
            detailData.nim,
            detailData.judul,
          );
      editor.commands.setContent(defaultContent);
      form.setFieldValue('isi_surat', defaultContent);
    }
  }, [editor, detailData]);

  const tagRender = (props: any) => {
    const { label, closable, onClose } = props;
    return (
      <Tag closable={closable} onClose={onClose} style={{ marginRight: 3 }}>
        {label}
      </Tag>
    );
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const showModalPDF = async () => {
    const values = await form.validateFields();
    setPreviewFormData(values);
    setIsModalPDFVisible2(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleReset = () => {
    form.setFields([
      {
        name: 'pemberi_tanda_tangan',
        value: undefined,
        touched: false,
      },
      {
        name: 'docFile',
        value: undefined,
        touched: false,
      },
    ]);
    setFileSuratKeluar([]); // Clear the upload list
    message.success('File Surat berhasil direset');
  };

  const modules = {
    toolbar: [['bold']],
  };

  const formats = [
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'script',
    'sub',
    'super',
    'blockquote',
    'code-block',
    'header',
    'list',
    'bullet',
    'indent',
    'align',
    'direction',
    'link',
    'image',
    'video',
  ];

  const title =
    suratMasukDetail?.tipe_suratId === 'ak15'
      ? 'PKL'
      : suratMasukDetail?.tipe_suratId === 'ak8'
        ? 'SKL'
        : suratMasukDetail?.tipe_suratId === 'srb'
          ? 'Surat Rekomendasi Beasiswa'
          : '';

  return (
    <div className="p-6">
      <Title level={3}>Detail Surat - Petugas Akademik</Title>
      <Divider />
      <Card>
        <EnhancedSteps
          currentStep={getCurrentStep(
            suratMasukDetail?.tipe_surat.id,
            suratMasukDetail || undefined,
          )}
          progresses={suratMasukDetail?.progresses}
          tipe_suratId={suratMasukDetail?.tipe_suratId}
        />
      </Card>
      <Divider />

      {/* Informasi Surat dan Progres Surat */}
      <Row gutter={16} className="mb-6">
        {/* Informasi Surat */}
        <Col span={24} lg={12} md={24} sm={24}>
          <Card
            title="Informasi Surat"
            className="h-full"
          >
            <Descriptions
              column={1}
              size="small"
              colon={false}
              labelStyle={{
                fontWeight: 500,
                color: '#595959',
                width: '110px'
              }}
              contentStyle={{
                color: '#262626'
              }}
            >
              <Descriptions.Item label="Nomor Surat">
                {suratMasukDetail?.id}
              </Descriptions.Item>

              <Descriptions.Item label="Tanggal">
                {suratMasukDetail && formatTanggal(suratMasukDetail.tanggal_pengajuan)}
              </Descriptions.Item>

              <Descriptions.Item label="Perihal">
                {suratMasukDetail?.tipe_surat.nama_surat}
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                {suratMasukDetail && getStatusTag(suratMasukDetail.status || '')}
              </Descriptions.Item>

              {suratMasukDetail?.lampirans && suratMasukDetail.lampirans.length > 0 && (
                <Descriptions.Item label="Lampiran">
                  <div style={{ maxWidth: '100%', width: '100%' }}>
                    {suratMasukDetail.lampirans.map((lampiran: any) => {
                      const fileName = lampiran.link_lampiran.split('/').pop();
                      return (
                        <div
                          key={lampiran.id}
                          style={{
                            marginBottom: 6,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <a
                            href={lampiran.link_lampiran}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '13px',
                              color: '#1890ff',
                              textDecoration: 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              minWidth: 0
                            }}
                            title={fileName || `Lampiran ${lampiran.id}`}
                          >
                            {fileName || `Lampiran ${lampiran.id}`}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </Descriptions.Item>
              )}

              {(!suratMasukDetail?.lampirans || suratMasukDetail.lampirans.length === 0) && (
                <Descriptions.Item label="Lampiran">
                  <Typography.Text type="secondary" style={{ fontSize: '13px', fontStyle: 'italic' }}>
                    Tidak ada lampiran
                  </Typography.Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* Progres Surat */}
        <Col span={24} lg={12} md={24} sm={24}>
          <ProgressSection progresses={suratMasukDetail?.progresses} />
        </Col>
      </Row>

      <Divider />

      {/* Komentar */}
      {/* {suratMasukDetail && (
        <Row gutter={16}>
          <Col span={24}>
            <CommentsSection
              comments={suratMasukDetail.komentars}
              id={suratMasukDetail.id}
              komentator={"Petugas Akademik"}
              type={undefined}
            />
          </Col>
        </Row>
      )} */}

      {/* <Divider /> */}

      <Card title="Preview Data" style={{ marginTop: 5 }}>
        <Button type="primary" icon={<EyeOutlined />} onClick={showModal}>
          Preview Data
        </Button>

        <Modal
          title="Detail Surat"
          open={isModalVisible}
          onCancel={handleCancel}
          width={1000}
          footer={null}
        >
          {detailData && (
            <>
              {suratMasukDetail?.tipe_suratId === 'ak15' && (
                <AK15DetailDescriptions detailData={detailData} />
              )}
              {suratMasukDetail?.tipe_suratId === 'ak8' && (
                <AK8DetailDescriptions detailData={detailData} />
              )}
              {suratMasukDetail?.tipe_suratId === 'srb' && (
                <SRBDetailDescriptions detailData={detailData} />
              )}
            </>
          )}
        </Modal>
      </Card>
      <Divider />

      {/* Outgoing Letter Form */}
      {detailData &&
        suratMasukDetail?.status === 'MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK' &&
        suratMasukDetail?.tipe_suratId === 'ak15' && (
          <Card title="Form Surat Keluar" style={{ marginTop: 5 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                hal: 'Permohonan Izin ' + detailData.pengatar_untuk,
                tujuan_surat: isiTujuanSuratPkl(
                  detailData.tujuan_surat,
                  detailData.jabatan,
                  detailData.instansi,
                  detailData.alamat_instansi,
                ),
                lampiran: `-`,
                tanggal_surat: detailData ? moment(new Date()) : null,
                isi_surat: isiSuratDefault(
                  detailData.pengatar_untuk,
                  detailData.jenjang,
                  detailData.Prodi,
                  detailData.Departemen,
                  detailData.nama,
                  detailData.nim,
                  detailData.judul,
                ),
              }}
            >
              {/* Hidden fields for tanggal_surat and lampiran */}
              <Form.Item
                name="tanggal_surat"
                initialValue={detailData ? moment(new Date()) : null}
                hidden
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="lampiran" initialValue="-" hidden>
                <Input />
              </Form.Item>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="hal"
                    label="Hal"
                    rules={[{ required: true, message: 'Masukkan perihal surat' }]}
                    hidden
                  >
                    <Input placeholder="Masukkan perihal surat" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="tujuan_surat"
                label="Tujuan Surat"
                rules={[{ required: true, message: 'Masukkan minimal satu tujuan' }]}
                hidden
              >
                <ReactQuill
                  modules={modules}
                  formats={formats}
                  theme="snow"
                  style={{ height: '150px', marginBottom: '50px' }}
                />
              </Form.Item>

              <Form.Item
                name="isi_surat"
                label="Isi Surat"
                rules={[
                  {
                    required: true,
                    message: 'Masukkan isi surat',
                  },
                ]}
                hidden
              >
                <div style={{ border: '1px solid #d9d9d9', borderRadius: '4px', padding: '5px' }}>
                  <MenuBar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              </Form.Item>

              <Form.Item
                name="tembusan"
                label="Tembusan"
                initialValue={[`Ketua Departemen ${detailData.Prodi} FSM Undip`]}
                hidden
              >
                <Select
                  mode="tags"
                  placeholder="Masukkan tembusan surat"
                  tagRender={tagRender}
                  tokenSeparators={[',']}
                />
              </Form.Item>

              <Form.Item
                name="pemberi_tanda_tangan"
                label="Pemberi Tanda Tangan"
                rules={[{ required: true, message: 'Pilih pemberi tanda tangan' }]}
              >
                <Select placeholder="Pilih pemberi tanda tangan">
                  {signers.map((signer) => (
                    <Select.Option key={signer.uuid} value={signer.Pegawai.nip}>
                      {signer.name} - {signer.Pegawai.jabatan} ({signer.Pegawai.nip})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Modal
                title="Surat Pengantar Hasil AK.15"
                open={isModalPDFloadVisible}
                onCancel={handleCancelPDF}
                width={1000}
                footer={null}
              >
                {detailData && (
                  <PDFViewer width="100%" height="1000px">
                    <SuratPengantarAK15 formData={previewFormData} dataTambahan={detailData} />
                  </PDFViewer>
                )}
              </Modal>
            </Form>
          </Card>
        )}

      <Divider />

      {/* Tindakan Petugas Akademik */}
      {detailData && suratMasukDetail?.status === 'MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK' && (
        <Card title="Tindakan Pegawai Akademik" style={{ marginTop: 5 }}>
          <Form
            form={form}
            onFinish={async (values) => {
              try {
                setLoading(true);
                await handleSubmit(values);
                message.success('Data akademik berhasil disimpan');
              } catch (error) {
                console.error('Error in submit:', error);
                message.error('Gagal menyimpan data akademik');
              } finally {
                setLoading(false);
              }
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Preview and Download Section */}
              <Space
                size="middle"
                style={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap' }}
              >
                <Button
                  icon={<EyeOutlined />}
                  loading={loading}
                  onClick={showModalPDF}
                  style={{ minWidth: 130 }}
                >
                  Preview PDF Saat Ini
                </Button>
              </Space>

              {/* Upload Section */}
              <div
                style={{
                  padding: '16px',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '2px solid #f0f0f0',
                }}
              >
                <Space
                  size="middle"
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    flexDirection: 'column',
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
                    style={{ marginBottom: 0 }}
                  ></Form.Item>
                  <Space size="middle">
                    <Space
                      size="middle"
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
                    >
                      {/* Download */}
                      <DownloadDOCXSuratPengantarAK15
                        formData={form.getFieldsValue()}
                        dataTambahan={detailData}
                      />

                      {/* upload */}
                      <Upload
                        name="docFile"
                        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        maxCount={1}
                        {...suratKeluarUploadProps}
                      >
                        <Button style={{ marginRight: '18px' }} icon={<UploadOutlined />}>
                          Upload File .docx Revisi
                        </Button>
                      </Upload>
                    </Space>
                  </Space>
                </Space>
              </div>

              {/* Action Buttons AKADEMIK BAWAH*/}
              <Form.Item>
                <ResponsiveSpace size="middle">
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={loading}
                  >
                    Simpan & Lanjutkan ke Supervisor
                  </Button>{' '}
                  <Button icon={<FileOutlined />} onClick={handleReset}>
                    Reset Input Revisi
                  </Button>
                </ResponsiveSpace>
              </Form.Item>
            </Space>
          </Form>
        </Card>
      )}

      {detailData &&
        suratMasukDetail?.status === 'MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK' &&
        suratMasukDetail?.tipe_suratId === 'srb' && (
          <Card title="Form Surat Keluar" style={{ marginTop: 5 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                hal: 'Pengajuan Surat Rekomendasi Beasiswa',
                tujuan_surat: `-`,
                lampiran: `-`,
                tanggal_surat: moment(new Date()),
                tembusan: [`-`],
              }}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="tanggal_surat"
                    label="Tanggal Surat"
                    rules={[{ required: true, message: 'Pilih tanggal surat' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="isi_surat"
                label="Isi Surat"
                rules={[{ required: true, message: 'Masukkan isi surat' }]}
              >
                <div style={{ border: '1px solid #d9d9d9', borderRadius: '4px', padding: '5px' }}>
                  <MenuBar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              </Form.Item>

              <Form.Item
                name="pemberi_tanda_tangan"
                label="Pemberi Tanda Tangan"
                rules={[{ required: true, message: 'Pilih pemberi tanda tangan' }]}
              >
                <Select placeholder="Pilih pemberi tanda tangan">
                  {signers.map((signer) => (
                    <Select.Option key={signer.uuid} value={signer.Pegawai.nip}>
                      {signer.name} - {signer.Pegawai.jabatan} ({signer.Pegawai.nip})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Modal
                title="Surat Rekomendasi Beasiswa"
                open={isModalPDFloadVisible}
                onCancel={handleCancelPDF}
                width={1000}
                footer={null}
              >
                {detailData && (
                  <PDFViewer width="100%" height="1000px">
                    <SuratRekomendasiBeasiswa
                      formData={previewFormData}
                      dataTambahan={detailData}
                    />
                  </PDFViewer>
                )}
              </Modal>

              <Form.Item>
                <ResponsiveSpace size="middle">
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    loading={loading}
                    onClick={showModalPDF}
                  >
                    Preview Surat Rekomendasi Beasiswa
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={loading}
                  >
                    Simpan
                  </Button>
                  <Button icon={<FileOutlined />} onClick={() => form.resetFields()}>
                    Reset
                  </Button>
                </ResponsiveSpace>
              </Form.Item>
            </Form>
          </Card>
        )}

      {detailData &&
        suratMasukDetail?.status === 'MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK' &&
        suratMasukDetail?.tipe_suratId === 'ak8' && (
          <Card title="Form Surat Keluar" style={{ marginTop: 5 }}>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="keterangan"
                    label="Keterangan"
                    rules={[{ required: true, message: 'Masukkan keterangan' }]}
                  >
                    <TextArea rows={4} placeholder="Masukkan keterangan" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <ResponsiveSpace size="middle">
                  <Button type="primary" icon={<FileOutlined />} onClick={handleSubmit}>
                    Cetak Surat
                  </Button>

                  <Button
                    danger
                    icon={<FileOutlined />}
                    onClick={async () => {
                      try {
                        const values = await form.validateFields();
                        // Handle reject letter logic here
                        message.success('Surat berhasil ditolak');
                      } catch (error) {
                        message.error('Gagal menolak surat');
                      }
                    }}
                  >
                    Tolak
                  </Button>
                </ResponsiveSpace>
              </Form.Item>
            </Form>
          </Card>
        )}
    </div>
  );
};

export default SuratKeluarCreate;
