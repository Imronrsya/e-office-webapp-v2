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
  isNumbered?: boolean;
}

const DetailAction: React.FC = () => {
  const { id } = useParams();
  const location = useLocation() as { pathname: string; state?: LocationState };
  const access = useAccess();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const axios = new AxiosService();

      // Use the correct endpoint for surat keluar
      const response = (await axios.get(
        `/v1/pengajuan/surat-keluar/${id}`,
      )) as { data?: any };
      // console.log("Raw response:", response.data);

      const responseData = response.data?.data;
      if (!responseData) {
        throw new Error("No data received from server");
      }

      // Set the main data
      setData(responseData);

      // Handle detail data - check if this is from surat masuk or direct surat keluar
      try {
        if (responseData.surat_masuk) {
          // This is a surat keluar generated from surat masuk
          const suratMasukInfo = responseData.surat_masuk.information;
          if (suratMasukInfo) {
            setDetailData(
              typeof suratMasukInfo === "string"
                ? JSON.parse(suratMasukInfo)
                : suratMasukInfo,
            );
          }
        } else {
          // This is a direct surat keluar
          const directInfo = responseData.information;
          if (directInfo) {
            setDetailData(
              typeof directInfo === "string"
                ? JSON.parse(directInfo)
                : directInfo,
            );
          } else {
            // Fallback to basic info if no detailed information available
            setDetailData({
              nama: responseData.nama,
              nim: responseData.nim,
              program_studi: responseData.program_studi,
              departemen: responseData.departemen,
              semester: responseData.semester,
            });
          }
        }
      } catch (parseError) {
        console.error("Error parsing information:", parseError);
        // Set basic info as fallback
        setDetailData({
          nama: responseData.nama,
          nim: responseData.nim,
          program_studi: responseData.program_studi,
          departemen: responseData.departemen,
          semester: responseData.semester,
        });
      }
    } catch (error) {
      console.error("Error fetching surat keluar data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);
  const getTitle = () => {
    if (access.isUPA && location.state?.isNumbered) {
      return "Penomoran Berhasil";
    }
    return location.state?.status === "DITOLAK" ? "Dikembalikan" : "Disetujui";
  };
  const getRoleName = () => {
    if (access.isPetugasTu) return "Petugas Tata Usaha";
    if (access.isKtu) return "Kepala Tata Usaha";
    if (access.isSpvAka) return "Supervisor Akademik";
    if (access.isSpvSda) return "Supervisor Sumber Daya";
    if (access.isWd1) return "Wakil Dekan 1";
    if (access.isWd2) return "Wakil Dekan 2";
    if (access.isDekan) return "Dekan";
    return "";
  };
  const getNextRole = () => {
    // Debug information
    console.log("Current data:", {
      status: data?.status,
      keterangan: data?.keterangan,
      information: data?.information,
      latestProgress: data?.progresses?.[data.progresses.length - 1],
      accessRoles: {
        isKtu: access.isKtu,
        isSpvAka: access.isSpvAka,
        isDekan: access.isDekan,
        isSpvSda: access.isSpvSda,
      },
      locationState: location.state,
    });

    // If the letter is rejected, it goes back to the student
    if (location.state?.status === "DITOLAK") {
      return "Mahasiswa";
    }

    // Handle Dekan's approval
    if (access.isDekan && location.state?.status === "DISETUJUI") {
      if (data?.status === "PENOMORAN") {
        return "Proses Penomoran";
      }
      return "Unit Pelayanan Akademik";
    }

    // When Manajer TU forwards to Wakil Dekan
    if (access.isKtu && location.state?.status === "DISETUJUI") {
      const info =
        typeof data?.information === "string"
          ? JSON.parse(data.information)
          : data?.information;

      const shouldForwardToWakilDekan =
        info?.keterangan?.toLowerCase().includes("wakil dekan") ||
        info?.tujuan === "WAKIL_DEKAN" ||
        data?.keterangan?.toLowerCase().includes("wakil dekan") ||
        data?.status?.includes("WAKIL_DEKAN");

      if (shouldForwardToWakilDekan) {
        return "Wakil Dekan";
      }
    }

    // Check for specific status transitions
    switch (data?.status) {
      case "MENUNGGU_VERIFIKASI_WAKIL_DEKAN":
      case "SURAT_KELUAR_MENUNGGU_VERIFIKASI_WAKIL_DEKAN":
      case "VERIFIKASI_WADEK_1":
        return "Wakil Dekan";
      case "MENUNGGU_VERIFIKASI_MANAJER_TU":
      case "SURAT_KELUAR_MENUNGGU_VERIFIKASI_MANAJER_TU":
        return "Manajer Tata Usaha";
      case "MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK":
      case "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK":
        return "Supervisor Akademik";
      case "SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_SUMBERDAYA":
        return "Supervisor Sumberdaya";
      case "MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK":
        return "Petugas Akademik";
      case "PENOMORAN":
        return "Proses Penomoran";
      default:
        // Default to Petugas Akademik unless explicitly rejected
        const status = location.state?.status as
          | "DISETUJUI"
          | "DITOLAK"
          | undefined;
        return status === "DITOLAK" ? "Mahasiswa" : "Petugas Akademik";
    }
  };
  const getStatusColor = () => {
    // Map different status types to colors
    if (data?.status?.includes("DITOLAK")) return "error";
    if (data?.status?.includes("DISETUJUI") || data?.status === "SELESAI")
      return;
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
    // Handle penomoran success message
    if (access.isUPA && location.state?.isNumbered) {
      return "Anda telah berhasil memberikan nomor surat";
    }

    // Handle rejection cases
    if (location.state?.status === "DITOLAK") {
      // Customize rejection message based on role
      if (access.isSpvAka) {
        if (data?.tipe_suratId === "ak006" || data?.tipe_suratId === "ak007") {
          return "Anda telah menolak surat dan mengembalikan ke Mahasiswa";
        } else {
          return "Anda telah mengembalikan surat ke Petugas Akademik untuk direvisi";
        }
      } else if (access.isKtu) {
        if (data?.tipe_suratId === "ak006" || data?.tipe_suratId === "ak007") {
          return "Anda telah menolak surat dan mengembalikan ke Mahasiswa";
        } else {
          return "Anda telah mengembalikan surat ke Petugas Akademik untuk direvisi";
        }
      } else if (access.isWd1) {
        if (data?.tipe_suratId === "ak006" || data?.tipe_suratId === "ak007") {
          return "Anda telah menolak surat dan mengembalikan ke Mahasiswa";
        } else {
          return "Anda telah menolak surat dan mengembalikan ke Petugas Akademik";
        }
      } else if (access.isDekan) {
        return "Anda telah menolak surat dan mengembalikan ke Petugas Akademik";
      } else if (access.isSpvSda) {
        return "Anda telah mengembalikan surat ke Mahasiswa";
      }
      return "Anda telah menolak surat dan mengembalikan ke Mahasiswa";
    }

    // Handle approval cases
    if (access.isDekan && location.state?.status === "DISETUJUI") {
      if (data?.status === "PENOMORAN") {
        return "Surat telah disetujui dan sedang dalam proses penomoran";
      }
      return "Anda telah menyetujui surat dan meneruskan ke Unit Pelayanan Akademik";
    }

    // When Manajer TU forwards to Wakil Dekan
    if (access.isKtu && location.state?.status === "DISETUJUI") {
      const info =
        typeof data?.information === "string"
          ? JSON.parse(data.information)
          : data?.information;

      const shouldForwardToWakilDekan =
        info?.keterangan?.toLowerCase().includes("wakil dekan") ||
        info?.tujuan === "WAKIL_DEKAN" ||
        data?.keterangan?.toLowerCase().includes("wakil dekan") ||
        data?.status?.includes("WAKIL_DEKAN");

      if (shouldForwardToWakilDekan) {
        return "Anda telah menyetujui surat dan meneruskan ke Wakil Dekan";
      }
    }

    if (access.isSpvSda && location.state?.status === "DISETUJUI") {
      return "Anda telah menyetujui surat dan meneruskan ke Manajer Tata Usaha";
    }

    // For other cases, use getNextRole
    const nextRole = getNextRole();
    return `Anda telah menyetujui surat dan meneruskan ke ${nextRole}`;
  };

  // Fungsi untuk mendapatkan role dari URL
  const getRole = () => {
    const pathParts = location.pathname.split("/");
    const roleIndex = pathParts.indexOf("surat-keluar") + 1;
    return pathParts[roleIndex];
  };
  // Fungsi untuk mendapatkan path navigasi
  const getNavigationPaths = () => {
    let role = getRole();

    // Jika role adalah pegawai, arahkan ke MTU, pengecualian
    if (role === "petugas" || role === "spv") {
      role = "mtu";
    }
    return {
      list: "/surat/surat-keluar",
      detail: `/surat-keluar/${role}/${id}`,
      current: `/surat-keluar/${role}/action/${id}`,
    };
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
              breadcrumbName: "Surat Keluar",
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
          <Result
            icon={statusIcon}
            // status={location.state?.status === 'DITOLAK' ? 'error' : 'success'}
            title={
              <Typography.Title
                level={3}
                style={{
                  margin: 0,
                  textAlign: "center",
                  // color: location.state?.status === 'DITOLAK' ? '#ff4d4f' : '#52c41a'
                }}
              >
                {getTitle()}
              </Typography.Title>
            }
            subTitle={
              <Typography.Text
                style={{
                  fontSize: 16,
                  display: "block",
                  textAlign: "center",
                  // color: location.state?.status === 'DITOLAK' ? '#ff7875' : '#666'
                }}
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
              {data?.nomor_surat || (data?.id ? `SK-${data.id}` : '-')}
            </Descriptions.Item>
            <Descriptions.Item 
              label={<Typography.Text strong>Tanggal</Typography.Text>}
              labelStyle={{ background: '#fafafa' }}
            >
              {data?.tanggal_pengajuan ? formatTanggal(data.tanggal_pengajuan) : 
                data?.created_at ? formatTanggal(data.created_at) : '-'}
            </Descriptions.Item>
            <Descriptions.Item 
              label={<Typography.Text strong>Perihal</Typography.Text>}
              labelStyle={{ background: '#fafafa' }}
              span={2}
            >
              {data?.perihal || 
               data?.tipe_surat?.nama_surat || 
               (data?.surat_masuk?.tipe_surat?.nama_surat) || '-'}
            </Descriptions.Item>
            <Descriptions.Item 
              label={<Typography.Text strong>Diproses Oleh</Typography.Text>}
              labelStyle={{ background: '#fafafa' }}
            >
              {data?.processor?.nama || 
               data?.surat_masuk?.processor?.nama || 
               getRoleName(data?.role_id) || 
               'Supervisor Akademik'}
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
                    const fileName = lampiran.link_lampiran?.split('/').pop();
                    return (
                      <Button 
                        key={lampiran.id} 
                        type="link" 
                        icon={<FileTextOutlined />}
                        href={lampiran.link_lampiran}
                        target="_blank"
                      >
                        {fileName || `Lampiran ${lampiran.id}`}
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
        </Card>         */}
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
              currentStep={getCurrentStep(
                data?.surat_masuk?.tipe_surat?.id || data?.tipe_surat?.id,
                data
              )}
              progresses={data?.progresses || []}
              tipe_suratId={data?.tipe_surat?.id || data?.surat_masuk?.tipe_surat?.id}
              suratKeluar={true}
              enableDetail={true}
            />
            {data?.progresses && data.progresses.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <Timeline>
                  {data.progresses.map((progress: any, index: number) => (
                    <Timeline.Item 
                      key={index} 
                      color={progress.status === 'DITOLAK' ? 'red' : progress.status === 'DISETUJUI' ? 'green' : 'blue'}
                    >
                      <div>
                        <strong>{progress.role || progress.status}</strong>
                        <div style={{ color: '#666' }}>{progress.keterangan || '-'}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {progress.created_at ? formatTanggal(progress.created_at) : '-'}
                        </div>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
          </div>
        </Card> */}

        {/* <Card 
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
