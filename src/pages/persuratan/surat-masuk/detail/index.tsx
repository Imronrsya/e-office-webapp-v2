import { AxiosService } from '@/utils/axios';
import { SuratMasuk } from '@/utils/data';
import { CalendarOutlined, CloseCircleOutlined, ExclamationCircleOutlined, EyeOutlined, RollbackOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { useAccess, useNavigate, useParams } from '@umijs/max';
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
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { CommentsSection, ProgressSection } from '@/pages/components/CommentandProgress';
import AK15DetailDescriptions from '@/pages/components/AK15DetailData';
import { getStatusTag } from '@/pages/components/StatusTag';
import { formatTanggal } from '@/pages/components/FormatTanggalUmumIndo';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

import styled from 'styled-components';
import SRBDetailDescriptions from '@/pages/components/SRBDetailData';
import AK8DetailDescriptions from '@/pages/components/AK8DetailData';
import { getCurrentStep } from '@/constant/step';
import EnhancedSteps from '@/pages/components/EnhanceStep';
import { InformasiDetailSuratCard } from '@/components/Surat/InformasiDetailSuratCard';

export const ResponsiveSpace = styled(Space)`
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    width: 100%;

    .ant-btn {
      width: 100%;
      margin-right: 0 !important;
      margin-bottom: 8px;
    }
  }
`;

const SuratMasukDetail: React.FC<SuratMasukDetailProps> = () => {
  const [form] = Form.useForm();
  const access = useAccess();
  const navigate = useNavigate();
  const [data, setData] = useState<SuratMasuk | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [lampiranUrls, setLampiranUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [petugas, setPetugas] = useState();

  const { id } = useParams();

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const axios = new AxiosService();
      const petugas = await axios.get(`/v1/role/petugas`);
      setPetugas(petugas.data.data)
      const response = await axios.get(`/v1/pengajuan/${id}`);
      setData(response.data.data);
      const parsedInfo = JSON.parse(response.data.data.information || '{}');
      setDetailData(parsedInfo);

      // Build presigned URLs for all lampirans
      const lampirans = response?.data?.data?.lampirans || [];
      if (Array.isArray(lampirans) && lampirans.length > 0) {
        const urls: string[] = [];
        for (const lam of lampirans) {
          const fd = new FormData();
          fd.append('object_name', lam.link_lampiran);
          fd.append('jenis_file', 'lampiran');
          fd.append('Expired', '3600');
          try {
            const res: any = await axios.post(`/minio/get-file`, fd);
            const presigned = res?.data?.body?.data?.data;
            if (presigned) urls.push(presigned);
          } catch (e) {
            console.warn('Gagal mendapatkan URL lampiran untuk', lam.link_lampiran);
          }
        }
        setLampiranUrls(urls);
      } else {
        setLampiranUrls([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForward = async (values: any) => {
    Modal.confirm({
      title: 'Konfirmasi Ulang',
      icon: <ExclamationCircleOutlined />,
      content: 'Apakah Anda yakin ingin melanjutkan ke petugas selanjutnya.',
      okText: 'Ya Teruskan',
      cancelText: 'Tidak',
      onOk: async () => {
        if (data?.status === 'MENUNGGU_VERIFIKASI_MANAJER_TU') {
          let role = 0;

          if (access.isPetugasTu) {
            role = 4;
          } else if (access.isKtu) {
            role = 8;
          }

          const axios = new AxiosService();
          const result = await axios.patch<any>(`/v1/pengajuan/${id}/changeStatus`, {
            status: 'DISETUJUI',
            role: role,
            roleTujuan: access.isKtu ? 2 : 1,
            keterangan: values.catatan // Tambahan ini untuk mengirim catatan ke database
          });

          if (result) {
            message.success('Surat berhasil diserahkan');
            navigate(`/surat/surat-masuk/action/${id}`, {
              state: {
                status: 'DISETUJUI',
                message: 'Surat berhasil diteruskan'
              }
            });
          } else {
            message.error('Surat gagal diserahkan');
          }
          fetchData();
        } else if (data?.status === 'MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK') {
          const axios = new AxiosService();
          const result = await axios.patch<any>(`/v1/pengajuan/${id}/changeStatus`, {
            status: 'DISETUJUI',
            role: 8,
            roleTujuan: 8,
            keterangan: values.catatan // Tambahan ini untuk mengirim catatan ke database
          });

          if (result) {
            message.success('Pembatalan berhasil');
          } else {
            message.success('Pembatalan gagal');
          }
          fetchData();
        }
      },
    });
  };

  const handleReject = async () => {
    try {
      const reason = await form.validateFields(['catatan']);
      setLoading(true);

      let role = 0;

      if (access.isPetugasTu) {
        role = 4;
      } else if (access.isKtu) {
        role = 8;
      }

      const axios = new AxiosService();
      const result = await axios.patch<any>(`/v1/pengajuan/${id}/changeStatus`, {
        status: 'DITOLAK',
        role: role,
        keterangan: reason.catatan
      });

      if (result) {
        message.success('Surat berhasil ditolak');
        navigate(`/surat/surat-masuk/action/${id}`, {
          state: {
            status: 'DITOLAK',
            message: 'Surat telah ditolak',
            reason: reason.catatan
          }
        });
      } else {
        message.error('Surat gagal ditolak');
      }

      setRejectModalVisible(false);
      fetchData();
      form.resetFields();
    } catch (error) {
      if (error.errorFields) {
        message.error('Mohon isi catatan penolakan');
      } else {
        message.error('Gagal menolak surat');
        console.error('Error rejecting letter:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };


  return (
    <div className="p-6">
      {/* Header Section */}
      <Title level={3}>Detail Surat Masuk</Title>
      <Divider />

      <Card>
        <EnhancedSteps
          currentStep={getCurrentStep(data?.tipe_surat.id, data || undefined)}
          progresses={data?.progresses}
          tipe_suratId={data?.tipe_surat.id}
        />
      </Card>
      <Divider />

      {/* Informasi Surat dan Progres Surat */}
      <Row gutter={16} className="mb-6">
        {/* Informasi Surat */}
        {InformasiDetailSuratCard({ data, lampiranUrls })}

        {/* Progres Surat */}
        <Col span={24} lg={12} md={24} sm={24}>
          <ProgressSection progresses={data?.progresses} />
        </Col>
      </Row>

      <Divider />

      <Card title="preview surat">
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
              {data?.tipe_suratId === 'ak15' && (
                <AK15DetailDescriptions detailData={detailData} />
              )}
              {data?.tipe_suratId === 'ak8' && (
                <AK8DetailDescriptions detailData={detailData} />
              )}
              {data?.tipe_suratId === 'srb' && (
                <SRBDetailDescriptions detailData={detailData} />
              )}
            </>
          )}
        </Modal>
      </Card>

      <Divider />

      {/* Form Kirim Surat */}
      {data?.status === 'MENUNGGU_VERIFIKASI_MANAJER_TU' ? (
        <Card
          title="Teruskan Surat"
          className="shadow-sm"
          headStyle={{
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #e8e8e8'
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleForward}
            requiredMark="optional"
          >
            <Form.Item
              name="catatan"
              label="Catatan"
              hasFeedback
              validateFirst
            >
              <TextArea
                rows={4}
                placeholder="Masukkan catatan atau instruksi tambahan"
                showCount
                maxLength={500}
                // autoFocus
              />
            </Form.Item>

            <Form.Item>
              <ResponsiveSpace size="middle">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SendOutlined />}
                  loading={loading}
                >
                  {access.isKtu ? 'Teruskan ke Supervisor Akademik' : 'Teruskan ke siapa'}
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => setRejectModalVisible(true)}
                  loading={loading}
                >
                  Kembalikan ke Mahasiswa
                </Button>
              </ResponsiveSpace>
            </Form.Item>
          </Form>
        </Card>
      ) : (<Card
        title="Aksi Surat"
        className="shadow-sm"
        headStyle={{
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e8e8e8'
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleForward}
          requiredMark="optional"
        >
          <Form.Item>
            <ResponsiveSpace size="middle">
              <Button
                danger
                htmlType="submit"
                icon={<CloseCircleOutlined />}
                loading={loading}
              >
                {'Batalkan Disposisi'}
              </Button>
            </ResponsiveSpace>
          </Form.Item>
        </Form>
      </Card>
      )}


      <Modal
        title="Konfirmasi Penolakan"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={loading}
        okText="Ya, Tolak"
        cancelText="Batal"
        okButtonProps={{ danger: true }}
      >
        <p>Apakah Anda yakin ingin menolak surat ini?</p>
        <p>Catatan yang Anda tulis akan digunakan sebagai alasan penolakan.</p>
      </Modal>

      <Divider />

      {/* Komentar */}
      {/* {data && <Row gutter={16}>
        <Col span={24}>
          <CommentsSection
            comments={data?.komentars}
            id={data?.id}
            komentator={petugas?.nip}
          />
        </Col>
      </Row>} */}
    </div>
  );
};

export default SuratMasukDetail;
