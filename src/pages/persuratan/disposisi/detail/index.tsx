import { AxiosService } from '@/utils/axios';
import { SignerOption, SuratMasuk } from '@/utils/data';
import { EyeOutlined, FileOutlined, SaveOutlined } from '@ant-design/icons';
import { PDFViewer } from '@react-pdf/renderer';
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
} from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useParams } from 'umi';
import SuratPengantarAK15 from '../../akademik/pkl/pdf/SuratPengantar';
import SuratRekomendasiBeasiswa from '../../akademik/surat-rekomendasi-beasiswa/pdf/SuratRekomendasi';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Underline as UnderlineIcon
} from 'lucide-react';
import AK15DetailDescriptions from '@/pages/components/AK15DetailData';
import SRBDetailDescriptions from '@/pages/components/SRBDetailData';
import { ResponsiveSpace } from '../../surat-masuk/detail';
import AK8DetailDescriptions from '@/pages/components/AK8DetailData';

const { Title } = Typography;

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
  const [dispositionDetail, setDispositionDetail] = useState<DispositionDetail | null>(null);
  const [suratMasukDetail, setSuratMasukDetail] = useState<SuratMasuk>();
  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [signers, setSigners] = useState<SignerOption[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalPDFloadVisible, setIsModalPDFVisible2] = useState(false);
  const [previewFormData, setPreviewFormData] = useState<any>(null);

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
          icon={<UnderlineIcon className={editor.isActive('underline') ? 'text-blue-500' : ''} size={18} />}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <Divider type="vertical" />
        <Button
          type="text"
          size="small"
          icon={<AlignLeft className={editor.isActive({ textAlign: 'left' }) ? 'text-blue-500' : ''} size={18} />}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        />
        <Button
          type="text"
          size="small"
          icon={<AlignCenter className={editor.isActive({ textAlign: 'center' }) ? 'text-blue-500' : ''} size={18} />}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        />
        <Button
          type="text"
          size="small"
          icon={<AlignRight className={editor.isActive({ textAlign: 'right' }) ? 'text-blue-500' : ''} size={18} />}
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
      const response = await axios.get(`/v1/pengajuan/disposisi/${id}`);
      if (response.status === 200) {
        const pengajuanResponse = await axios.get(`/v1/pengajuan/${response.data.data.id_surat}`);
        if (pengajuanResponse) {
          setSuratMasukDetail(pengajuanResponse.data.data);
          setDetailData(JSON.parse(pengajuanResponse.data.data.information))
        }
      }
      setDispositionDetail(response.data.data);
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
      setSigners(response.data.data);
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
      const axios = new AxiosService();

      if (suratMasukDetail?.tipe_suratId === 'srb') {
        await axios.post('/v1/pengajuan/surat-keluar', {
          ...values,
          id_disposisi: dispositionDetail?.id,
          id_surat_masuk: suratMasukDetail?.id,
          tanggal_surat: values.tanggal_surat.format('YYYY-MM-DD'),
          lampiran: '-',
          hal: '-',
          tujuan_surat: '-',
          tembusan: ['-'],
          isi_surat: values.isi_surat,
          pemberi_tanda_tangan: values.pemberi_tanda_tangan
        });
      } else {
        // Handle kasus non-SRB seperti sebelumnya
        await axios.post('/v1/pengajuan/surat-keluar', {
          ...values,
          id_disposisi: dispositionDetail?.id,
          id_surat_masuk: suratMasukDetail?.id,
          tanggal_surat: values.tanggal_surat.format('YYYY-MM-DD')
        });
      }

      message.success('Surat keluar berhasil dibuat');
    } catch (error) {
      message.error('Gagal membuat surat keluar');
    } finally {
      setLoading(false);
    }
  };

  const isiSuratDefault = (pengatar_untuk: string, jenjang: string, prodi: string, departemen: string, nama: string, nim: string, judul: string,) => {
    return `<p>Sehubungan dengan kegiatan ${nama} mahasiswa Program Studi ${jenjang} ${prodi} Departemen ${departemen} Fakultas Sains dan Matematika Universitas Diponegoro tersebut di bawah ini:</p>
    <br/>
    <p>
    Nama&nbsp;&nbsp;:&nbsp;&nbsp; ${nama}<br/>
    NIM&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp; ${nim}<br/>
    Judul&nbsp;&nbsp&nbsp;:&nbsp;&nbsp; ${judul}
    </p>
    <br>
    <p>dengan ini mohon diizinkan bagi mahasiswa tersebut untuk melaksanakan ${pengatar_untuk} di Instansi Saudara. Segala persyaratan dan konsekuensi yang ada menjadi tanggung jawab mahasiswa yang bersangkutan.</p>
    <br>
    <p>Atas perhatian Saudara kami ucapkan terimakasih.</p>`;
  }

  const isiSuratRekomendasiBeasiswa = (nama: string, nim: string, tempat_lahir: string, tanggal_lahir: string, kontak: string, tahun_akademik: string, Departemen: string, semester: string, IPK: string, IPS: string, nama_beasiswa: string) => {
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
        Nama&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${nama}<br/>
        NIM&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${nim}<br/>
        Tempat/Tgl Lahir&nbsp;&nbsp;&nbsp;: ${tempat_lahir}, ${tanggal_lahir}<br/>
        No HP&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${kontak}<br/>
    </p>
    <p>Pada tahun akademik ${formattedTahunAkademik} terdaftar sebagai mahasiswa Fakultas Sains dan Matematika Universitas Diponegoro</p>
    <p>
        Jurusan&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${Departemen}<br/>
        Semester&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${semester}<br/>
        IPK&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${IPK}<br/>
        IPS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${IPS}<br/>
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
  }

  useEffect(() => {
    if (editor && detailData) {
      const defaultContent = suratMasukDetail?.tipe_suratId === 'srb'
        ? isiSuratRekomendasiBeasiswa(
            detailData.nama,
            detailData.nim,
            detailData.tempat_lahir,
            detailData.tanggal_lahir,
            detailData.kontak,
            detailData.tahun_akademik,
            detailData.Departemen,
            detailData.semester,
            detailData.IPK,
            detailData.IPS,
            detailData.nama_beasiswa
          )
        : isiSuratDefault(
            detailData.pengatar_untuk,
            detailData.jenjang,
            detailData.Prodi,
            detailData.Departemen,
            detailData.nama,
            detailData.nim,
            detailData.judul
          );
      editor.commands.setContent(defaultContent);
      form.setFieldValue('isi_surat', defaultContent);
    }
  }, [editor, detailData]);

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

  const modules = {
    toolbar: [
      ['bold'],
    ],
  };

  const formats = [
    'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script', 'sub', 'super',
    'blockquote', 'code-block',
    'header', 'list', 'bullet',
    'indent', 'align',
    'direction',
    'link', 'image', 'video',
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
      <Title level={3}>Buat Surat Keluar - {title}</Title>
      <Divider />

      {/* Disposition Info */}
      <Card title="Detail Disposisi" className="mb-6">
        <Descriptions column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }} bordered>
          <Descriptions.Item label="Nomor Surat Masuk">{suratMasukDetail?.id}</Descriptions.Item>
          <Descriptions.Item label="Pengirim">
            {suratMasukDetail?.nim_mahasiswa}
          </Descriptions.Item>
          <Descriptions.Item span={2} label="Perihal">{suratMasukDetail?.tipe_surat.nama_surat}</Descriptions.Item>
          <Descriptions.Item span={2} label="Catatan Disposisi">
            {dispositionDetail?.keterangan}
          </Descriptions.Item>
          <Descriptions.Item label="Lampiran" span={2}>
            {suratMasukDetail?.lampirans?.map((lampiran) => {
              const fileName = lampiran.link_lampiran.split('/').pop();
              return (
                <div key={lampiran.id} style={{ marginBottom: '8px' }}>
                  <a href={lampiran.link_lampiran} target="_blank" rel="noreferrer">
                    {fileName ? fileName : `Lampiran ${lampiran.id}`}
                  </a>
                </div>
              );
            })}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Divider />
      <Card title="Preview Data" style={{marginTop: 5}}>
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

      {/* Outgoing Letter Form */}
      {detailData && suratMasukDetail?.status === 'MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK' && suratMasukDetail?.tipe_suratId === 'ak15' && (
        <Card title="Form Surat Keluar"  style={{marginTop: 5}}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}
            initialValues={{
              hal: "Permohonan Izin " + detailData.pengatar_untuk,
              tujuan_surat: `Yth. ${detailData.tujuan_surat}<br/>${detailData.jabatan}<br/>${detailData.instansi}<br/>${detailData.alamat_instansi}`,
              lampiran: `-`,
              tanggal_surat: detailData ? moment(new Date()) : null,
              isi_surat: isiSuratDefault(detailData.pengatar_untuk, detailData.jenjang, detailData.Prodi, detailData.Departemen, detailData.nama, detailData.nim, detailData.judul)
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="tanggal_surat"
                  label="Tanggal Surat"
                  rules={[{ required: true, message: 'Pilih tanggal surat' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="lampiran" label="Lampiran">
                  <Input placeholder="Masukkan jumlah lampiran" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>

              <Col span={24}>
                <Form.Item
                  name="hal"
                  label="Hal"
                  rules={[{ required: true, message: 'Masukkan perihal surat' }]}
                >
                  <Input placeholder="Masukkan perihal surat" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="tujuan_surat"
              label="Tujuan Surat"
              rules={[{ required: true, message: 'Masukkan minimal satu tujuan' }]}
            >
              <ReactQuill modules={modules}
                formats={formats} theme="snow" style={{ height: '150px', marginBottom: '50px' }} />
            </Form.Item>

            <Form.Item
              name="isi_surat"
              label="Isi Surat"
              rules={[
                {
                  required: true,
                  message: 'Masukkan isi surat'
                }
              ]}
            >
             <div style={{ border: '1px solid #d9d9d9', borderRadius: '4px', padding: '5px' }}>
                <MenuBar editor={editor} />
                <EditorContent editor={editor} />
              </div>
            </Form.Item>

            <Form.Item name="tembusan" label="Tembusan" initialValue={[`Ketua Departemen ${detailData.Prodi} FSM Undip`]}>
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

            <Form.Item>
              <ResponsiveSpace size="middle">
                <Button type="primary" icon={<EyeOutlined />} loading={loading} onClick={showModalPDF} >
                  Preview Hasil Surat Pengantar
                </Button>
                <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={loading}>
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
    </div>
  );
};

export default SuratKeluarCreate;
