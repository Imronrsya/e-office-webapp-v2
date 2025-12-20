import AK15DetailDescriptions from '@/pages/components/AK15DetailData';
import AK8DetailDescriptions from '@/pages/components/AK8DetailData';
import { formatTanggal } from '@/pages/components/FormatTanggalUmumIndo';
import SRBDetailDescriptions from '@/pages/components/SRBDetailData';
import { getStatusTag } from '@/pages/components/StatusTag';
import { AxiosService } from '@/utils/axios';
import { SuratMasuk } from '@/utils/data';
import {
  CalendarOutlined,
  CloseOutlined,
  EyeOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAccess } from '@umijs/max';
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
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams } from 'umi';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SuratMasukDekanDetail: React.FC = () => {
  const [form] = Form.useForm();
  const access = useAccess();
  const [data, setData] = useState<SuratMasuk | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [dispositionType, setDispositionType] = useState('forward'); // 'forward' or 'reject'
  const { id } = useParams();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const axios = new AxiosService();
      const response = await axios.get<any>(`/v1/pengajuan/${id}`);
      setData(response.data.data);
      const parsedInfo = JSON.parse(response.data.data.information || '{}');
      setDetailData(parsedInfo);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDisposition = async (values: any) => {
    try {
      let role = 0;

      // masih bisa berubah
      if (access.isDekan) {
        role = 5;
      } else if (access.isWd1) {
        role = 6;
      } else if (access.isWd2) {
        role = 7;
      }

      const axios = new AxiosService();
      const result = await axios.patch<any>(`/v1/pengajuan/${id}/changeStatus`, {
        status: 'DISETUJUI',
        role: role,
        roleTujuan: parseInt(values.tujuan),
      });
      console.log(result);
      if (result) {
        message.success('Surat berhasil didisposisi');
      } else {
        message.success('Surat gagal didisposisi');
      }
    } catch (error) {
      console.log(error);
      message.error('Terjadi kesalahan saat memproses disposisi');
    }
  };

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);

  const [showAllComments, setShowAllComments] = useState(false);
  const [showAllProgress, setShowAllProgress] = useState(false);

  const toggleShowAllComments = () => {
    setShowAllComments(!showAllComments);
  };

  const toggleShowAllProgress = () => {
    setShowAllProgress(!showAllProgress);
  };

  return (
    <div className="p-6">
      <Title level={3}>Detail Surat Masuk - Dekan</Title>
      <Divider />

      {/* Detail Informasi Surat */}
      <Card title="Informasi Surat" className="mb-6">
        <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}>
          <Descriptions.Item label="Nomor Surat">{data.keterangan_surat}</Descriptions.Item>
          <Descriptions.Item label="Tanggal">{formatTanggal(data.tanggal_pengajuan)}</Descriptions.Item>
          <Descriptions.Item label="Perihal">{data.tipe_surat.nama_surat}</Descriptions.Item>
          <Descriptions.Item label="Pengirim">{data.nim_mahasiswa}</Descriptions.Item>
          <Descriptions.Item label="Status">
            {getStatusTag(data.status)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider />

      {/* Preview Button */}
      <Card title="Preview Surat" className="mb-6">
        <Button type="primary" icon={<EyeOutlined />} onClick={showModal}>
          Preview Detail Surat
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

      {/* Disposition Form */}
      <Card title="Form Disposisi" className="mb-6">
        <Form form={form} layout="vertical" onFinish={handleDisposition}>
          <Form.Item name="disposition_type" initialValue="forward">
            <Radio.Group
              onChange={(e) => setDispositionType(e.target.value)}
              value={dispositionType}
            >
              <Radio.Button value="forward">Disposisi</Radio.Button>
              <Radio.Button value="reject">Tolak</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {dispositionType === 'forward' && (
            <Form.Item
              name="tujuan"
              label="Disposisi Kepada"
              rules={[{ required: true, message: 'Pilih tujuan disposisi' }]}
            >
              <Select placeholder="Pilih tujuan disposisi">
                <Option value="6">Wakil Dekan 1 (Akademik)</Option>
                <Option value="2">Supervisor Akademik</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="catatan"
            label="Catatan Disposisi"
            rules={[{ required: true, message: 'Masukkan catatan disposisi' }]}
          >
            <TextArea
              rows={4}
              placeholder={
                dispositionType === 'forward'
                  ? 'Masukkan catatan disposisi'
                  : 'Masukkan alasan penolakan'
              }
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={dispositionType === 'forward' ? <SendOutlined /> : <CloseOutlined />}
                danger={dispositionType === 'reject'}
              >
                {dispositionType === 'forward' ? 'Disposisi Surat' : 'Tolak Surat'}
              </Button>
              <Button onClick={() => form.resetFields()}>Reset</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      {/* History */}
      <Row gutter={16}>
        <Col lg={12}>
          <Card
            title="Komentar"
            className="mb-6"
            extra={
              <Button onClick={toggleShowAllComments}>
                {showAllComments ? 'Show Less' : 'Show All'}
              </Button>
            }
          >
            <Timeline>
              {(showAllComments ? data.komentars : data.komentars?.slice(0, 1))?.map((comment) => (
                <Timeline.Item color="blue" key={comment.id}>
                  <>
                    <p>
                      <UserOutlined /> {comment.komentator}
                      <br />
                      <small>
                        <CalendarOutlined /> {comment.tanggal}
                      </small>
                    </p>
                    <p>{comment.komentar}</p>
                  </>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
        <Col lg={12}>
          <Card
            title="Riwayat Disposisi"
            className="mb-6"
            extra={
              <Button onClick={toggleShowAllProgress}>
                {showAllProgress ? 'Show Less' : 'Show All'}
              </Button>
            }
          >
            <Timeline>
              {(showAllProgress ? data.progresses : data.progresses?.slice(0, 1))?.map(
                (progress) => (
                  <Timeline.Item
                    color={progress.status === 'DITOLAK' ? 'red' : 'blue'}
                    key={progress.id}
                  >
                    <>
                      <p>
                        <UserOutlined /> {progress.role.nama}
                        <br />
                        <small>
                          <CalendarOutlined /> {progress.tanggal}
                        </small>
                      </p>
                      <p>
                        Status:{' '}
                        <Tag color={progress.status === 'DITOLAK' ? 'error' : 'processing'}>
                          {progress.status}
                        </Tag>
                      </p>
                      <p>Catatan: {progress.catatan}</p>
                    </>
                  </Timeline.Item>
                ),
              )}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SuratMasukDekanDetail;
