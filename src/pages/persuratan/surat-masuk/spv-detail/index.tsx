import { getCurrentStep } from "@/constant/step";
import AK15DetailDescriptions from "@/pages/components/AK15DetailData";
import AK8DetailDescriptions from "@/pages/components/AK8DetailData";
import SRBDetailDescriptions from "@/pages/components/SRBDetailData";
import AK006DetailDescriptions from "@/pages/components/AK006DetailData";
import {
  CommentsSection,
  ProgressSection,
} from "@/pages/components/CommentandProgress";
import EnhancedSteps from "@/pages/components/EnhanceStep";
import { formatTanggal } from "@/pages/components/FormatTanggalUmumIndo";
import { getStatusTag } from "@/pages/components/StatusTag";
import { AxiosService } from "@/utils/axios";
import { SuratMasuk } from "@/utils/data";
import {
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAccess } from "@umijs/max";
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
  Spin,
  Tag,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "umi";
import e from "express";

const { Title } = Typography;
const { TextArea } = Input;

interface Employee {
  uuid: string;
  name: string;
  position: string;
}

interface SuratDetailState {
  data: SuratMasuk | null;
  petugas: any;
  detailData: any;
  employees: Employee[];
  isLoading: boolean;
  isModalVisible: boolean;
  rejectModalVisible: boolean;
}

const SuratDetailSupervisor: React.FC = () => {
  const [form] = Form.useForm();
  const access = useAccess();
  const { id } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState<SuratDetailState>({
    data: null,
    petugas: null,
    detailData: null,
    employees: [],
    isLoading: false,
    isModalVisible: false,
    rejectModalVisible: false,
  });
  console.log("STATE", state);
  const axios = new AxiosService();

  const fetchData = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const petugasPromise = axios.get(`/v1/role/petugas`);
      const pengajuanPromise = axios.get<any>(`/v1/pengajuan/${id}`);
      const spvAkademikPromise = axios.get<any>(`/v1/pegawai/2`);
      const pegawaiPromise = axios.get<any>(`/v1/pegawai/9`);
      const spvSumberdayaPromise = axios.get<any>(`/v1/pegawai/27`);
      const mtuPromise = axios.get<any>(`/v1/pegawai/8`);

      const [
        petugasResponse,
        response,
        responseSpvAkademik,
        responsePegawai,
        responseSpvSumberdaya,
        responseMtu,
      ] = await Promise.all([
        petugasPromise,
        pengajuanPromise,
        spvAkademikPromise,
        pegawaiPromise,
        spvSumberdayaPromise,
        mtuPromise,
      ]);

      const detailData = JSON.parse(response.data.data.information || "{}");
      const spvAkademik = responseSpvAkademik.data.data;
      const spvSumberdaya = responseSpvSumberdaya.data.data;
      const mtu = responseMtu.data.data;
      const pegawai = responsePegawai.data.data;

      const semuaPegawai = [
        ...pegawai,
        ...spvAkademik,
        ...spvSumberdaya,
        ...mtu,
      ];

      const mapping = semuaPegawai.map((item: any) => {
        return {
          uuid: item.uuid,
          name: item.name,
          position: item.HakAkses[0]?.roleRef.nama || "Unknown",
        };
      });

      setState((prev) => ({
        ...prev,
        data: response.data.data,
        petugas: (petugasResponse.data as any).data,
        detailData: detailData,
        employees: mapping,
        isLoading: false,
      }));
      console.log("EMPLOYEES", mapping);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Gagal mengambil data surat");
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDisposition = async (values: any) => {
    if (state.data?.status === "MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK") {
      const jenisSuratUntukMtu = ["ak006"];
      const harusKeMtu = jenisSuratUntukMtu.includes(state.data.tipe_suratId);

      if (harusKeMtu) {
        // Skenario 1: Kirim ke MTU (role 8)
        Modal.confirm({
          title: "Konfirmasi Disposisi",
          content:
            "Anda akan meneruskan surat ini ke Manajer Tata Usaha. Lanjutkan?",
          onOk: async () => {
            try {
              setState((prev) => ({ ...prev, isLoading: true }));

              const payload = {
                status: "DISETUJUI",
                role: 2,
                roleTujuan: 8,
                keterangan: values.note,
              };

              const result = await axios.patch(
                `/v1/pengajuan/${id}/changeStatus`,
                payload,
              );

              if (result) {
                message.success("Surat berhasil didisposisikan ke Manager TU");
                form.resetFields();
                // Navigate to action result page
                navigate(`/surat-masuk/spv/action/${id}`, {
                  state: {
                    status: "DISETUJUI",
                    message: "Surat berhasil didisposisikan ke Manager TU",
                  },
                });
              }
            } catch (error) {
              message.error("Gagal mendisposisikan surat");
            } finally {
              setState((prev) => ({ ...prev, isLoading: false }));
            }
          },
        });
      } else {
        // Skenario 2: Kirim ke Pegawai (role 9)
        Modal.confirm({
          title: "Konfirmasi Ulang",
          content:
            "Apakah Anda yakin ingin melanjutkan ke petugas selanjutnya.",
          onOk: async () => {
            try {
              setState((prev) => ({ ...prev, isLoading: true }));

              const payload = {
                status: "DISETUJUI",
                role: 2,
                roleTujuan: 9,
                uuids: [values.employees],
                keterangan: values.note,
              };

              const result = await axios.patch(
                `/v1/pengajuan/${id}/changeStatus`,
                payload,
              );

              if (result) {
                message.success("Surat berhasil didisposisikan ke pegawai");
                form.resetFields();
                // Navigate to action result page
                navigate(`/surat-masuk/spv/action/${id}`, {
                  state: {
                    status: "DISETUJUI",
                    message: "Surat berhasil didisposisikan ke pegawai",
                  },
                });
              }
            } catch (error) {
              message.error("Gagal mendisposisikan surat");
            } finally {
              setState((prev) => ({ ...prev, isLoading: false }));
            }
          },
        });
      }
    }
    if (state.data?.status === "MENUNGGU_VERIFIKASI_SUPERVISOR_SUMBERDAYA") {
      const jenisSuratUntukMtu = ["ak006"];
      const harusKeMtu = jenisSuratUntukMtu.includes(state.data.tipe_suratId);

      if (harusKeMtu) {
        // Skenario 1: Kirim ke MTU (role 8)
        Modal.confirm({
          title: "Konfirmasi Disposisi",
          content:
            "Anda akan meneruskan surat ini ke Manajer Tata Usaha. Lanjutkan?",
          onOk: async () => {
            try {
              setState((prev) => ({ ...prev, isLoading: true }));

              const payload = {
                status: "DISETUJUI",
                role: 27,
                roleTujuan: 8,
                keterangan: values.note,
              };

              const result = await axios.patch(
                `/v1/pengajuan/${id}/changeStatus`,
                payload,
              );

              if (result) {
                message.success("Surat berhasil didisposisikan ke Manager TU");
                form.resetFields();
                // Navigate to action result page
                navigate(`/surat-masuk/spv/action/${id}`, {
                  state: {
                    status: "DISETUJUI",
                    message: "Surat berhasil didisposisikan ke Manager TU",
                  },
                });
              }
            } catch (error) {
              message.error("Gagal mendisposisikan surat");
            } finally {
              setState((prev) => ({ ...prev, isLoading: false }));
            }
          },
        });
      } else {
        // Skenario 2: Kirim ke Pegawai (role 9)
        Modal.confirm({
          title: "Konfirmasi Ulang",
          content:
            "Apakah Anda yakin ingin melanjutkan ke petugas selanjutnya.",
          onOk: async () => {
            try {
              setState((prev) => ({ ...prev, isLoading: true }));

              const payload = {
                status: "DISETUJUI",
                role: 2,
                roleTujuan: 9,
                uuids: [values.employees],
                keterangan: values.note,
              };

              const result = await axios.patch(
                `/v1/pengajuan/${id}/changeStatus`,
                payload,
              );

              if (result) {
                message.success("Surat berhasil didisposisikan ke pegawai");
                form.resetFields();
                // Navigate to action result page
                navigate(`/surat-masuk/spv/action/${id}`, {
                  state: {
                    status: "DISETUJUI",
                    message: "Surat berhasil didisposisikan ke pegawai",
                  },
                });
              }
            } catch (error) {
              message.error("Gagal mendisposisikan surat");
            } finally {
              setState((prev) => ({ ...prev, isLoading: false }));
            }
          },
        });
      }
    } else {
      Modal.confirm({
        title: "Konfirmasi Ulang",
        icon: <ExclamationCircleOutlined />,
        content: "Apakah Anda yakin ingin membatalkan disposisi?",
        okText: "Ya Batalkan",
        cancelText: "Tidak Jadi",
        onOk: async () => {
          try {
            setState((prev) => ({ ...prev, isLoading: true }));

            const result = await axios.patch(
              `/v1/pengajuan/${id}/changeStatus`,
              {
                status: "DISETUJUI",
                role: 2,
                roleTujuan: 2,
              },
            );

            if (result) {
              message.success("Disposisi berhasil dibatalkan");
              form.resetFields();
              // Navigate to action result page
              navigate(`/surat-masuk/spv/action/${id}`, {
                state: {
                  status: "DISETUJUI",
                  message: "Disposisi berhasil dibatalkan",
                },
              });
            }
          } catch (error) {
            message.error("Gagal mendisposisikan surat");
          } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
          }
        },
      });
    }
  };

  const handleReject = async () => {
    try {
      const { note } = await form.validateFields(["note"]);
      const role = access.isSpvAka
        ? 2
        : access.isKtu
          ? 8
          : access.isSpvSda
            ? 27
            : 0;

      setState((prev) => ({ ...prev, isLoading: true }));

      const result = await axios.patch(`/v1/pengajuan/${id}/changeStatus`, {
        status: "DITOLAK",
        role,
        keterangan: note,
      });

      if (result) {
        message.success("Surat berhasil ditolak");
        setState((prev) => ({
          ...prev,
          rejectModalVisible: false,
          isLoading: false,
        }));
        form.resetFields();
        // Navigate to action result page
        navigate(`/surat-masuk/spv/action/${id}`, {
          state: {
            status: "DITOLAK",
            message: "Surat telah dikembalikan ke Mahasiswa",
          },
        });
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error("Mohon isi catatan penolakan");
      } else {
        console.error("Error rejecting letter:", error);
        message.error("Gagal menolak surat");
      }
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const tagRender = ({ label, value, closable, onClose }: any) => {
    const employee = state.employees.find((emp) => emp.uuid === value);
    return (
      <Tag
        color="blue"
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        <Space>
          <UserOutlined />
          {label}
          <small>({employee?.position})</small>
        </Space>
      </Tag>
    );
  };

  if (state.isLoading || !state.data) {
    return (
      <Spin
        size="large"
        className="flex justify-center items-center min-h-screen"
      />
    );
  }

  return (
    <div className="p-6">
      <Title level={3}>Detail Surat - Supervisor Akademik</Title>
      <Divider />
      <Card>
        <EnhancedSteps
          currentStep={getCurrentStep(state.data?.tipe_surat.id, state.data)}
          progresses={state.data?.progresses}
          tipe_suratId={state.data?.tipe_surat.id}
        />
      </Card>
      <Divider />

      {/* Informasi Surat dan Progres Surat */}
      <Row gutter={16} className="mb-6">
        {/* Informasi Surat */}
        <Col span={24} lg={12} md={24} sm={24}>
          <Card title="Informasi Surat" className="h-full">
            <Descriptions
              column={1}
              size="small"
              colon={false}
              labelStyle={{
                fontWeight: 500,
                color: "#595959",
                width: "110px",
              }}
              contentStyle={{
                color: "#262626",
              }}
            >
              <Descriptions.Item label="Nomor Surat">
                {state.data.id}
              </Descriptions.Item>

              <Descriptions.Item label="Tanggal">
                {formatTanggal(state.data.tanggal_pengajuan)}
              </Descriptions.Item>

              <Descriptions.Item label="Perihal">
                {state.data.tipe_surat.nama_surat}
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                {getStatusTag(state.data.status)}
              </Descriptions.Item>

              {state.data?.lampirans && state.data.lampirans.length > 0 && (
                <Descriptions.Item label="Lampiran">
                  <div style={{ maxWidth: "100%", width: "100%" }}>
                    {state.data.lampirans.map((lampiran: any) => {
                      const fileName = lampiran.link_lampiran.split("/").pop();
                      return (
                        <div
                          key={lampiran.id}
                          style={{
                            marginBottom: 6,
                            maxWidth: "100%",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={fileName || `Lampiran ${lampiran.id}`}
                          >
                            <a
                              href={lampiran.link_lampiran}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: "13px",
                                color: "#1890ff",
                                textDecoration: "none",
                                display: "inline-block",
                                maxWidth: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {fileName || `Lampiran ${lampiran.id}`}
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Descriptions.Item>
              )}

              {(!state.data?.lampirans ||
                state.data.lampirans.length === 0) && (
                <Descriptions.Item label="Lampiran">
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: "13px", fontStyle: "italic" }}
                  >
                    Tidak ada lampiran
                  </Typography.Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* Progres Surat */}
        <Col span={24} lg={12} md={24} sm={24}>
          <ProgressSection progresses={state.data?.progresses} />
        </Col>
      </Row>

      <Divider />

      <Card title="Preview Surat" className="mb-6">
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() =>
            setState((prev) => ({ ...prev, isModalVisible: true }))
          }
        >
          Preview Detail Surat
        </Button>

        <Modal
          title="Detail Surat"
          open={state.isModalVisible}
          onCancel={() =>
            setState((prev) => ({ ...prev, isModalVisible: false }))
          }
          width={1000}
          footer={null}
        >
          {state.detailData && (
            <>
              {state.data?.tipe_suratId === "ak15" && (
                <AK15DetailDescriptions detailData={state.detailData} />
              )}
              {state.data?.tipe_suratId === "ak8" && (
                <AK8DetailDescriptions detailData={state.detailData} />
              )}
              {state.data?.tipe_suratId === "srb" && (
                <SRBDetailDescriptions detailData={state.detailData} />
              )}
              {state.data?.tipe_suratId === "ak006" && (
                <AK006DetailDescriptions detailData={state.detailData} />
              )}
            </>
          )}
        </Modal>
      </Card>

      <Divider />

      {state.data.status === "MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK" ? (
        (() => {
          // 1. Tentukan jenis surat mana yang harus ke MTU
          const jenisSuratUntukMtu = ["ak006"];

          // 2. Periksa apakah surat saat ini termasuk dalam daftar di atas
          const harusKeMtu = jenisSuratUntukMtu.includes(
            state.data.tipe_suratId,
          );

          if (harusKeMtu) {
            // 3. Jika BENAR, tampilkan form sederhana untuk ke MTU (role 8)
            return (
              <Card
                title="Form Disposisi ke Manajer Tata Usaha"
                className="mb-6"
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleDisposition}
                >
                  <Form.Item name="note" label="Catatan (Opsional)">
                    <TextArea
                      rows={4}
                      placeholder="Masukkan catatan atau instruksi untuk Manajer TU"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SendOutlined />}
                        loading={state.isLoading}
                      >
                        Disposisi ke Manajer TU
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            );
          } else {
            // 4. Jika SALAH (alur default), tampilkan form ke Pegawai (role 9)
            return (
              <Card title="Form Disposisi Pegawai" className="mb-6">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleDisposition}
                >
                  <Form.Item
                    name="employees"
                    label="Pilih Pegawai"
                    rules={[
                      { required: true, message: "Pilih minimal satu pegawai" },
                    ]}
                  >
                    <Select
                      placeholder="Pilih pegawai untuk disposisi"
                      style={{ width: "100%" }}
                      options={state.employees
                        .filter((emp) => emp.position === "petugas akademik") //filter posisi petugas akademik
                        .map((emp) => ({
                          label: emp.name,
                          value: emp.uuid,
                        }))}
                    />
                  </Form.Item>

                  <Form.Item name="note" label="Catatan (Opsional)">
                    <TextArea
                      rows={4}
                      placeholder="Masukkan catatan atau instruksi"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SendOutlined />}
                        loading={state.isLoading}
                      >
                        Disposisi ke Pegawai
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            );
          }
        })()
      ) : state.data.status === "MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK" ? (
        <Card title="Form Disposisi Pegawai" className="mb-6">
          <Form form={form} layout="vertical" onFinish={handleDisposition}>
            <Form.Item>
              <Space>
                <Button
                  danger
                  htmlType="submit"
                  icon={<CloseCircleOutlined />}
                  loading={state.isLoading}
                >
                  Batalkan Disposisi
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ) : state.data.status === "MENUNGGU_VERIFIKASI_SUPERVISOR_SUMBERDAYA" ? (
        (() => {
          // 1. Tentukan jenis surat mana yang harus ke MTU
          const jenisSuratUntukMtu = ["ak006"];

          // 2. Periksa apakah surat saat ini termasuk dalam daftar di atas
          const harusKeMtu = jenisSuratUntukMtu.includes(
            state.data.tipe_suratId,
          );

          if (harusKeMtu) {
            // 3. Jika BENAR, tampilkan form sederhana untuk ke MTU (role 8)
            return (
              <Card
                title="Form Disposisi ke Manajer Tata Usaha"
                className="mb-6"
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleDisposition}
                >
                  <Form.Item name="note" label="Catatan (Opsional)">
                    <TextArea
                      rows={4}
                      placeholder="Masukkan catatan atau instruksi untuk Manajer TU"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SendOutlined />}
                        loading={state.isLoading}
                      >
                        Disposisi ke Manajer TU
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            );
          } else {
            // 4. Jika SALAH (alur default), tampilkan form ke Pegawai (role 9)
            return (
              <Card title="Form Disposisi Pegawai" className="mb-6">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleDisposition}
                >
                  <Form.Item
                    name="employees"
                    label="Pilih Pegawai"
                    rules={[
                      { required: true, message: "Pilih minimal satu pegawai" },
                    ]}
                  >
                    <Select
                      placeholder="Pilih pegawai untuk disposisi"
                      style={{ width: "100%" }}
                      options={state.employees
                        .filter((emp) => emp.position === "petugas akademik") //filter posisi petugas akademik
                        .map((emp) => ({
                          label: emp.name,
                          value: emp.uuid,
                        }))}
                    />
                  </Form.Item>

                  <Form.Item name="note" label="Catatan (Opsional)">
                    <TextArea
                      rows={4}
                      placeholder="Masukkan catatan atau instruksi"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SendOutlined />}
                        loading={state.isLoading}
                      >
                        Disposisi ke Pegawai
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            );
          }
        })()
      ) : (
        <></>
      )}

      <Modal
        title="Konfirmasi Penolakan"
        open={state.rejectModalVisible}
        onOk={handleReject}
        onCancel={() =>
          setState((prev) => ({ ...prev, rejectModalVisible: false }))
        }
        okText="Ya, Tolak"
        cancelText="Batal"
        okButtonProps={{ danger: true }}
      >
        <p>Apakah Anda yakin ingin menolak surat ini?</p>
        <p>Catatan yang Anda tulis akan digunakan sebagai alasan penolakan.</p>
      </Modal>

      <Divider />

      {/* Komentar
      {state.data && (
        <Row gutter={16}>
          <Col span={24}>
            <CommentsSection
              comments={state.data.komentars}
              id={state.data.id}
              komentator={state.petugas?.nip}
            />
          </Col>
        </Row>
      )} */}
    </div>
  );
};

export default SuratDetailSupervisor;
