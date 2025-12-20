import { formatTanggal } from "@/pages/components/FormatTanggalUmumIndo";
import { getStatusTag } from "@/pages/components/StatusTag";
import { AxiosService } from "@/utils/axios";
import { PaginationParams, SignerOption, SuratMasuk } from "@/utils/data";
import { SearchOutlined, SendOutlined } from "@ant-design/icons";
import { Link, useAccess } from "@umijs/max";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  message,
} from "antd";
import { useEffect, useState } from "react";

interface TableFilters {
  search: string;
  status: string;
  dateRange: [string, string] | null;
}

const SuratMasukPage = () => {
  const [data, setData] = useState<SuratMasuk[]>([]);
  const [history, setHistory] = useState<SuratMasuk[]>([]);
  const [selectedRows, setSelectedRows] = useState<SuratMasuk[]>([]);
  const [roles, setRoles] = useState<SignerOption[]>([]);
  const [filters, setFilters] = useState<TableFilters>({
    search: "",
    status: "",
    dateRange: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const access = useAccess();
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    size: 5,
  });
  const [total, setTotal] = useState(0);
  const [totalHistory, setTotalHistory] = useState(0);

  // ... (keep existing state)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const getLink = (id: string) => {
    if (access.canVerif) {
      return <Link to={`/surat/surat-masuk/${id}`}>Detail</Link>;
    } else if (access.canDisposisi) {
      if (access.isSpvAka || access.isSpvSda) {
        return <Link to={`/surat-masuk/spv/${id}`}>Detail</Link>;
      }
      return <Link to={`/surat-masuk/disposisi/${id}`}>Detail</Link>;
    } else if (access.isPetugasAka) {
      return <Link to={`/surat-masuk/petugas-akademik/${id}`}>Detail</Link>;
    } else {
      return null;
    }
  };

  const handleBatchVerify = async () => {
    if (selectedRows.length === 0) {
      message.warning("Please select items to verify");
      return;
    }
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: "No",
      render: (_: any, __: any, index: number) =>
        (pagination.page - 1) * pagination.size + index + 1,
    },
    {
      title: "Surat",
      dataIndex: ["tipe_surat", "nama_surat"],
      key: "surat",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search surat"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              onClick={() => confirm()}
              type="primary"
              icon={<SearchOutlined />}
            >
              Search
            </Button>
            <Button onClick={() => clearFilters()}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        record.tipe_surat.nama_surat
          .toLowerCase()
          .includes(value.toLowerCase()),
    },
    {
      title: "Pengirim",
      dataIndex: ["mahasiswa", "user", "name"],
      key: "mahasiswa",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search pengirim"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              onClick={() => confirm()}
              type="primary"
              icon={<SearchOutlined />}
            >
              Search
            </Button>
            <Button onClick={() => clearFilters()}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        record.mahasiswa.user.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Prodi/Departemen",
      key: "prodi",
      render: (_, record) => {
        try {
          const informationObj = JSON.parse(record.information);
          console.log("INFORMATION OBJ", informationObj);
          const prodi = informationObj.Prodi || "";
          const departemen = informationObj.departemen || "";
          const jurusan = informationObj.Jurusan || "";
          const program_studi = informationObj.program_studi || "";
          return prodi || departemen || jurusan || program_studi || "";
        } catch (error) {
          return "-";
        }
      },
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search prodi/departemen"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              onClick={() => confirm()}
              type="primary"
              icon={<SearchOutlined />}
            >
              Search
            </Button>
            <Button onClick={() => clearFilters()}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        try {
          const informationObj = JSON.parse(record.information);
          const searchValue = value.toLowerCase();
          const prodi =
            informationObj.Prodi &&
            informationObj.Prodi.toLowerCase().includes(searchValue);
          const departemen =
            informationObj.departemen &&
            informationObj.departemen.toLowerCase().includes(searchValue);
          return prodi || departemen;
        } catch {
          return false;
        }
      },
    },
    {
      title: "Tanggal Masuk",
      dataIndex: "updatedAt",
      key: "tanggal_pengajuan",
      render: (tanggal: string) => formatTanggal(tanggal),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <DatePicker.RangePicker
            value={selectedKeys[0]}
            onChange={(dates) => {
              setSelectedKeys(dates ? [dates] : []);
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
            >
              Filter
            </Button>
            <Button onClick={clearFilters} size="small">
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value: any, record) => {
        if (!value || !value[0] || !value[1]) return true;
        const recordDate = new Date(record.updatedAt);
        const startDate = new Date(value[0]);
        const endDate = new Date(value[1]);
        return recordDate >= startDate && recordDate <= endDate;
      },
    },
    {
      title: "Aksi",
      key: "action",
      dataIndex: "id",
      render: (id: string) => getLink(id),
    },
  ];

  const historyColumns = [
    {
      title: "No",
      render: (_: any, __: any, index: number) =>
        (pagination.page - 1) * pagination.size + index + 1,
    },
    {
      title: "Surat",
      dataIndex: ["tipe_surat", "nama_surat"],
      key: "surat",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search surat"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              onClick={() => confirm()}
              type="primary"
              icon={<SearchOutlined />}
            >
              Search
            </Button>
            <Button onClick={() => clearFilters()}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        record.tipe_surat.nama_surat
          .toLowerCase()
          .includes(value.toLowerCase()),
    },
    {
      title: "Pengirim",
      dataIndex: ["mahasiswa", "user", "name"],
      key: "mahasiswa",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search pengirim"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              onClick={() => confirm()}
              type="primary"
              icon={<SearchOutlined />}
            >
              Search
            </Button>
            <Button onClick={() => clearFilters()}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        record.mahasiswa.user.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Prodi/Departemen",
      key: "prodi",
      render: (_, record) => {
        try {
          const informationObj = JSON.parse(record.information);
          const jurusan = informationObj.Jurusan || "";
          const program_studi = informationObj.program_studi || "";
          return informationObj.Prodi || jurusan || program_studi || "-";
        } catch (error) {
          return "-";
        }
      },
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search prodi"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              onClick={() => confirm()}
              type="primary"
              icon={<SearchOutlined />}
            >
              Search
            </Button>
            <Button onClick={() => clearFilters()}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        try {
          const informationObj = JSON.parse(record.information);
          return informationObj.Prodi?.toLowerCase().includes(
            value.toLowerCase(),
          );
        } catch {
          return false;
        }
      },
    },
    {
      title: "Tanggal Masuk",
      dataIndex: "updatedAt",
      key: "tanggal_pengajuan",
      render: (tanggal: string) => formatTanggal(tanggal),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <DatePicker.RangePicker
            value={selectedKeys[0]}
            onChange={(dates) => {
              setSelectedKeys(dates ? [dates] : []);
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
            >
              Filter
            </Button>
            <Button onClick={clearFilters} size="small">
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value: any, record) => {
        if (!value || !value[0] || !value[1]) return true;
        const recordDate = new Date(record.updatedAt);
        const startDate = new Date(value[0]);
        const endDate = new Date(value[1]);
        return recordDate >= startDate && recordDate <= endDate;
      },
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render: (status: string) => {
        return getStatusTag(status);
      },
      filters: [
        {
          text: "Disetujui",
          value: "diterima",
        },
        {
          text: "Ditolak",
          value: "ditolak",
        },
        {
          text: "Diproses",
          value: "diproses",
        },
        {
          text: "Belum Diproses",
          value: "belum_diproses",
        },
      ],
      onFilter: (value: string, record) => record.status === value,
    },
    {
      title: "Aksi",
      key: "action",
      dataIndex: "id",
      render: (id: string) => getLink(id),
    },
  ];

  const fetchData = async (params: PaginationParams) => {
    try {
      setIsLoading(true);
      const axios = new AxiosService();

      let role = 0;
      if (access.isDekan) {
        role = 5;
      } else if (access.isPetugasAka) {
        role = 9;
      } else if (access.isSpvAka) {
        role = 2;
      } else if (access.isWd1) {
        role = 6;
      } else if (access.isPetugasTu) {
        role = 4;
      } else if (access.isKtu) {
        role = 8;
      } else if (access.isSpvSda) {
        role = 27;
      }

      const response = await axios.post<any>(
        `/v1/pengajuan/role`,
        {
          role: role,
        },
        {
          params: {
            page: params.page,
            size: params.size,
          },
        },
      );
      console.log("DASHBOARD DATA", response);
      setData(response.data.data);
      setTotal(response.data.total);

      const historyResponse = await axios.post<any>(
        `/v1/pengajuan/history/role`,
        {
          role: role,
        },
        {
          params: {
            page: params.page,
            size: params.size,
          },
        },
      );
      setHistory(historyResponse.data.data);
      setTotalHistory(historyResponse.data.total);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const axios = new AxiosService();
      const response = await axios.post("/v1/pegawai/daftar-pegawai", {
        roles: [5, 6, 7, 8, 2, 9, 24, 25, 27],
      });
      console.log("ROLES", response);
      setRoles(response.data.data);
    } catch (error) {
      console.log(error);
      message.error("Gagal mengambil daftar peran");
    }
  };

  useEffect(() => {
    fetchData(pagination);
    fetchRoles();
  }, [pagination.page, pagination.size]);

  const handleTableChange = (paginate: any) => {
    setPagination({
      page: paginate.current,
      size: paginate.pageSize,
    });
  };

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: SuratMasuk[]) => {
      setSelectedRows(selectedRows);
    },
    getCheckboxProps: (record: SuratMasuk) => ({
      // disabled: !access.canVerif, // Disable checkbox if user cannot verify
    }),
  };

  const handleModalSubmit = async (values: {
    destination: number;
    note: string;
  }) => {
    try {
      setIsVerifying(true);
      const axios = new AxiosService();

      const selectedIds = selectedRows.map((row) => row.id);

      console.log(values.destination);

      await axios.post("/v1/pengajuan/verify-batch", {
        idPengajuan: selectedIds,
        role: access.isDekan
          ? 5
          : access.isPetugasAka
            ? 9
            : access.isSpvAka
              ? 2
              : access.isSpvSda
                ? 27
                : access.isWd1
                  ? 6
                  : access.isPetugasTu
                    ? 4
                    : access.isKtu
                      ? 8
                      : 0,
        uuidTujuan: values.destination,
        keterangan: values.note,
      });

      message.success(`Successfully verified ${selectedRows.length} items`);
      setSelectedRows([]);
      setIsModalVisible(false);
      form.resetFields();
      fetchData(pagination);
    } catch (error) {
      console.error("Error verifying batch:", error);
      message.error("Failed to verify selected items");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <Card title="Antrean Verifikasi" style={{ marginBottom: 5 }}>
        <Table
          dataSource={data}
          columns={columns}
          loading={isLoading}
          rowKey="id"
          pagination={{
            total: total,
            pageSize: pagination.size,
            current: pagination.page,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          onChange={handleTableChange}
        />
      </Card>
      <Modal
        title="Verifikasi Batch"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleModalSubmit}>
          <Form.Item
            name="destination"
            label="Tujuan"
            rules={[{ required: true, message: "Pilih tujuan verifikasi" }]}
          >
            <Select
              placeholder="Pilih peran penerima"
              mode="multiple"
              optionFilterProp="children"
            >
              {roles &&
                roles.map((role) => (
                  <Select.Option key={role.uuid} value={role.uuid}>
                    {role.name} -{" "}
                    {role.Pegawai?.jabatan || "Jabatan tidak tersedia"}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="note"
            label="Keterangan"
            rules={[{ required: true, message: "Masukkan keterangan" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Masukkan keterangan atau catatan untuk verifikasi"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={isVerifying}
              >
                Verifikasi
              </Button>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
              >
                Batal
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      <Card title="Daftar Surat Masuk" style={{ marginBottom: 5 }}>
        <Table
          dataSource={history}
          columns={historyColumns}
          loading={isLoading}
          rowKey="id"
          pagination={{
            total: totalHistory,
            pageSize: pagination.size,
            current: pagination.page,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </>
  );
};

export default SuratMasukPage;
