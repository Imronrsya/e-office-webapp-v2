import React, { useEffect, useState } from "react";
import { useParams, useLocation, useAccess, useNavigate } from "@umijs/max";
import { PageContainer, ProCard } from "@ant-design/pro-components";
import {
  Card,
  Typography,
  Descriptions,
  Spin,
  Button,
  Space,
  Alert,
  Tag,
  Result,
  Divider,
} from "antd";
import AK15DetailDescriptions from "@/pages/components/AK15DetailData";
import AK8DetailDescriptions from "@/pages/components/AK8DetailData";
import { AxiosService } from "@/utils/axios";
import { formatTanggal } from "@/pages/components/FormatTanggalUmumIndo";
import {
  FileTextOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CalendarOutlined,
  UserOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import EnhancedSteps from "@/pages/components/EnhanceStep";
import { getCurrentStep } from "@/constant/step";

const { Title } = Typography;

interface LocationState {
  status?: "DISETUJUI" | "DITOLAK";
  previousStatus?: string;
  message?: string;
  isNumbered?: boolean;
}

// Helper functions
function getRole(userAccess: any) {
  if (userAccess.isPetugasAka) return "petugas-akademik";
  if (userAccess.isSpvAka) return "supervisor-akademik";
  if (userAccess.isWd1) return "wd1";
  if (userAccess.isWd2) return "wd2";
  if (userAccess.isDekan) return "dekan";
  if (userAccess.isMahasiswa) return "mahasiswa";
  if (userAccess.isPetugasTu) return "petugas-tu";
  if (userAccess.isKtu) return "manajer-tu";
  return "";
}

function getNavigationPaths(userAccess: any) {
  const role = getRole(userAccess);
  const basePath = "/surat/surat-masuk";

  // Build role-specific path
  const rolePath = role ? `${basePath}/${role}` : basePath;
  return {
    basePath,
    rolePath,
    routes: [
      { path: basePath, breadcrumbName: "Surat Masuk" },
      { path: rolePath, breadcrumbName: "Daftar Surat" },
      { path: "", breadcrumbName: "Status Persetujuan" },
    ],
  };
}

interface LocationState {
  status?: "DISETUJUI" | "DITOLAK";
}

const DetailAction: React.FC = () => {
  const { id } = useParams();
  const location = useLocation() as { pathname: string; state?: LocationState };
  const access = useAccess();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi untuk mendapatkan role dari URL
  const getRole = () => {
    const pathParts = location.pathname.split("/");
    const roleIndex = pathParts.indexOf("surat-masuk") + 1;
    return pathParts[roleIndex];
  };

  // Fungsi untuk mendapatkan path navigasi
  const getNavigationPaths = () => {
    const role = getRole();
    return {
      list: "/surat/surat-masuk",
      detail: `/surat-masuk/${role}/${id}`,
      current: `/surat-masuk/${role}/action/${id}`,
    };
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const axios = new AxiosService();
      const response = await axios.get(`/v1/pengajuan/${id}`);
      const responseData = response.data as any;
      setData(responseData.data);
      setDetailData(JSON.parse(responseData.data.information || "{}"));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);
  const getTitle = () => {
    return location.state?.status === "DITOLAK" ? "Dikembalikan" : "Disetujui";
  };

  const getRoleName = () => {
    if (access.isPetugasTu) return "Petugas Tata Usaha";
    if (access.isKtu) return "Kepala Tata Usaha";
    if (access.isSpvAka) return "Supervisor Akademik";
    if (access.isWd1) return "Wakil Dekan 1";
    if (access.isWd2) return "Wakil Dekan 2";
    if (access.isDekan) return "Dekan";
    return "";
  };
  const getNextRole = () => {
    // For Supervisor approving letters from Manager TU
    if (
      data?.status === "MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK" &&
      access.isSpvAka
    ) {
      return "Petugas Akademik";
    }

    // When Petugas Akademik approves, it should go to Supervisor Akademik
    if (access.isPetugasAka && location.state?.status === "DISETUJUI") {
      return "Supervisor Akademik";
    }

    // Default flow
    switch (data?.status) {
      case "MENUNGGU_VERIFIKASI_MANAJER_TU":
        return "Manajer Tata Usaha";
      case "MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK":
        return "Supervisor Akademik";
      case "MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1":
        return "Wakil Dekan 1";
      case "MENUNGGU_VERIFIKASI_WAKIL_DEKAN_2":
        return "Wakil Dekan 2";
      case "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK":
        return "Supervisor Akademik";
      case "DITOLAK":
        return "Mahasiswa";
      default:
        return location.state?.status === "DITOLAK"
          ? "Mahasiswa"
          : "Petugas Akademik";
    }
  };
  const getStatusColor = () => {
    // Map different status types to colors
    if (data?.status?.includes("DITOLAK")) return "error";
    if (data?.status?.includes("DISETUJUI") || data?.status === "SELESAI")
      return "success";
    if (data?.status?.includes("REVISI")) return "warning";
    return "processing";
  };
  const getActionStatus = () => {
    if (!data?.status) {
      return "Menunggu Verifikasi";
    }

    // Format status text
    return data.status
      .split("_")
      .map((word: string) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };
  const getActionMessage = () => {
    if (location.state?.status === "DITOLAK") {
      return "Anda telah menolak surat dan mengembalikan ke Mahasiswa";
    }

    const nextRole = getNextRole();

    // Special message for Supervisor approving letters from Manager TU
    if (
      data?.status === "MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK" &&
      access.isSpvAka
    ) {
      return "Anda telah menyetujui surat dan meneruskan ke Petugas Akademik";
    }

    // Special message when Petugas Akademik approves
    if (access.isPetugasAka && location.state?.status === "DISETUJUI") {
      return "Anda telah menyetujui surat dan meneruskan ke Supervisor Akademik";
    }

    return `Anda telah menyetujui surat dan meneruskan ke ${nextRole}`;
  };

  if (isLoading || !data) {
    return (
      <Spin
        size="large"
        className="flex justify-center items-center min-h-screen"
      />
    );
  }

  const statusIcon =
    location.state?.status === "DITOLAK" ? (
      <CloseCircleFilled style={{ fontSize: 48, color: "#ff4d4f" }} />
    ) : (
      <CheckCircleFilled style={{ fontSize: 48, color: "#52c41a" }} />
    );

  return (
    <PageContainer
      header={{
        title: "Status Persetujuan",
        breadcrumb: {
          routes: [
            {
              path: "",
              breadcrumbName: "Surat Masuk",
              onClick: () => {
                navigate(getNavigationPaths().list);
              },
            },
            {
              path: "",
              breadcrumbName: "Detail Surat",
              onClick: () => {
                navigate(getNavigationPaths().detail);
              },
            },
            {
              path: "",
              breadcrumbName: "Status Persetujuan",
            },
          ],
        },
        onBack: () => {
          navigate(getNavigationPaths().detail);
        },
      }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card variant="borderless">
          {" "}
          <Result
            icon={statusIcon}
            status={location.state?.status === "DITOLAK" ? "error" : "success"}
            title={
              <Typography.Title
                level={3}
                style={{ margin: 0, textAlign: "center" }}
              >
                {getTitle()}
              </Typography.Title>
            }
            subTitle={
              <Typography.Text
                style={{ fontSize: 16, display: "block", textAlign: "center" }}
              >
                {getActionMessage()}
              </Typography.Text>
            }
          />
        </Card>

        {/* <Card 
          title={
            <Space>
              <FileTextOutlined />
              <Typography.Text strong>Informasi Surat</Typography.Text>
            </Space>
          }
          style={{ padding: '0 1px' }}
        >
          <Descriptions 
            bordered 
            column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}
            size="middle"
            style={{ background: '#fff' }}
          >
            <Descriptions.Item 
              label={<Typography.Text strong>Nomor Surat</Typography.Text>}
              labelStyle={{ background: '#fafafa' }}
            >
              {data.id}
            </Descriptions.Item>
            <Descriptions.Item 
              label={<Typography.Text strong>Tanggal</Typography.Text>}
              labelStyle={{ background: '#fafafa' }}
            >
              {formatTanggal(data.tanggal_pengajuan)}
            </Descriptions.Item>
            <Descriptions.Item 
              label={<Typography.Text strong>Perihal</Typography.Text>}
              labelStyle={{ background: '#fafafa' }}
            >
              {data.tipe_surat.nama_surat}
            </Descriptions.Item>
            <Descriptions.Item 
              label={<Typography.Text strong>Diproses Oleh</Typography.Text>}
              labelStyle={{ background: '#fafafa' }}
            >
              {getRoleName()}
            </Descriptions.Item>
            <Descriptions.Item 
              label={<Typography.Text strong>Status</Typography.Text>}
              labelStyle={{ background: '#fafafa' }}
            >
              <Tag color={getStatusColor()}>
                {getActionStatus()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item 
              label={<Typography.Text strong>Lampiran</Typography.Text>}
              labelStyle={{ background: '#fafafa' }}
              span={2}
            >
              {data?.lampirans?.length ? (
                <Space direction="vertical">
                  {data.lampirans.map((lampiran: any) => {
                    const fileName = lampiran.link_lampiran.split('/').pop();
                    return (
                      <Button 
                        key={lampiran.id} 
                        type="link" 
                        icon={<FileTextOutlined />}
                        href={lampiran.link_lampiran}
                        target="_blank"
                      >
                        {fileName ? fileName : `Lampiran ${lampiran.id}`}
                      </Button>
                    );
                  })}
                </Space>
              ) : (
                <Typography.Text type="secondary" italic>
                  Tidak ada lampiran
                </Typography.Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card> */}

        {/* <Card 
          title={
            <Space>
              <CalendarOutlined />
              <Typography.Text strong>Progress Pengajuan Surat</Typography.Text>
            </Space>
          }
        >
          <div style={{ 
            padding: '24px',
            background: '#fafafa',
            borderRadius: '8px'
          }}>
            <EnhancedSteps
              currentStep={getCurrentStep(data?.tipe_surat.id, data || undefined)}
              progresses={data?.progresses}
              tipe_suratId={data?.tipe_surat.id}
            />
          </div>
        </Card>

        <Card 
          title={
            <Space>
              <ProfileOutlined />
              <Typography.Text strong>Detail Pengajuan</Typography.Text>
            </Space>
          }
        >
          {data?.tipe_suratId === 'ak15' ? (
            <AK15DetailDescriptions detailData={detailData} />
          ) : data?.tipe_suratId === 'ak8' ? (
            <AK8DetailDescriptions detailData={detailData} />
          ) : (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Typography.Title level={5} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserOutlined /> Data Akademik
                </Typography.Title>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0', width: '25%', background: '#fafafa' }}>
                        <Typography.Text strong>Nama</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0', width: '25%' }}>
                        {detailData?.nama || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0', width: '25%', background: '#fafafa' }}>
                        <Typography.Text strong>NIM</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0', width: '25%' }}>
                        {detailData?.nim || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Semester</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.semester || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>IPK</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.ipk || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>SKS</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.sks || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Departemen</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.departemen || detailData?.Departemen || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Program Studi</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.program_studi || detailData?.Prodi || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Jenjang</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.jenjang || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <Typography.Title level={5} style={{ marginBottom: 16, marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ProfileOutlined /> Keperluan
                </Typography.Title>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0', width: '25%' }}>
                        <Typography.Text strong>Alamat</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0', width: '25%' }}>
                        {detailData?.alamat || detailData?.Alamat || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0', width: '25%' }}>
                        <Typography.Text strong>Kontak</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0', width: '25%' }}>
                        {detailData?.kontak || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Pengantar Untuk</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.pengantar_untuk || detailData?.pengatar_untuk || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Tujuan Surat</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.tujuan_surat || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Jabatan</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.jabatan || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Nama Instansi</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.nama_instansi || detailData?.instansi || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Alamat Instansi</Typography.Text>
                      </td>
                      <td colSpan={3} style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.alamat_instansi || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <Typography.Title level={5} style={{ marginBottom: 16, marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileTextOutlined /> Data Lanjutan
                </Typography.Title>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0', width: '25%' }}>
                        <Typography.Text strong>Judul</Typography.Text>
                      </td>
                      <td colSpan={3} style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.judul || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Dosen Pembimbing</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.dosen_pembimbing || detailData?.nama_dosen_pembimbing || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>NIP Dosen Pembimbing</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.nip_dosen_pembimbing || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Dosen Koordinator</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.dosen_koordinator || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Nama Dosen Koordinator</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.nama_dosen_koordinator || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>NIP Dosen Koordinator</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.nip_dosen_koordinator || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>Nama Kaprodi</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.nama_kaprodi || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        <Typography.Text strong>NIP Kaprodi</Typography.Text>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}>
                        {detailData?.nip_kaprodi || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}></td>
                      <td style={{ padding: '12px', border: '1px solid #f0f0f0' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Space>
          )}
        </Card> */}
      </Space>
    </PageContainer>
  );
};

export default DetailAction;
