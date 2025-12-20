import { formatTanggal } from "@/pages/components/FormatTanggalUmumIndo";
import { getStatusTag } from "@/pages/components/StatusTag";
import { SuratData } from "@/services/persuratan/api";
import { AxiosService } from "@/utils/axios";
import { PaginationParams, SuratKeluar } from "@/utils/data";
import { SearchOutlined } from "@ant-design/icons";
import { Link, useAccess, useModel } from "@umijs/max";
import { Button, Card, DatePicker, Input, Space, Table, Tag } from "antd";
import { useEffect, useState } from "react";

const SuratKeluarPage = () => {
  const [data, setData] = useState<SuratKeluar[]>([]);
  const [history, setHistory] = useState<SuratKeluar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { initialState } = useModel("@@initialState");
  const access = useAccess();
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    size: 5,
  });
  const [total, setTotal] = useState(0);
  const [totalHistory, setTotalHistory] = useState(0);

  const getLink = (id: string) => {
    if (access.canVerifSuratKeluar) {
      if (access.isSpvSda) {
        return <Link to={`/surat-keluar/spv-sda/${id}`}>Detail</Link>;
      }
      return <Link to={`/surat-keluar/mtu/${id}`}>Detail</Link>;
    } else if (access.canProcess) {
      // return <Link to={`/surat-keluar/petugas/${id}`}>Detail</Link>;
      return <Link to={`/surat-keluar/mtu/${id}`}>Detail</Link>;
    } else if (access.canDisposisi) {
      return <Link to={`/surat-keluar/dekan/${id}`}>Detail</Link>;
    } else if (access.isPetugas) {
      return <Link to={`/surat-keluar/upa/${id}`}>Detail</Link>;
    } else {
      return null; // or return a default link or message if needed
    }
  };

  const columns = [
    {
      title: "No",
      render: (_: any, __: any, index: number) =>
        (pagination.page - 1) * pagination.size + index + 1,
    },
    {
      title: "Pengirim",
      dataIndex: ["surat_masuk", "mahasiswa", "user", "name"],
      key: "pengirim",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Cari pengirim"
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
              Cari
            </Button>
            <Button onClick={() => clearFilters()}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value: string, record) =>
        record.surat_masuk.mahasiswa.user.name
          .toLowerCase()
          .includes(value.toLowerCase()),
    },
    {
      title: "Surat",
      dataIndex: ["tipe_surat", "nama_surat"],
      key: "tipe_surat",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Cari tipe surat"
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
              Cari
            </Button>
            <Button onClick={() => clearFilters()}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value: string, record) =>
        record.tipe_surat.nama_surat
          .toLowerCase()
          .includes(value.toLowerCase()),
    },
    {
      title: "Hal",
      dataIndex: "hal",
      key: "hal",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Cari hal"
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
              Cari
            </Button>
            <Button onClick={() => clearFilters()}>Reset</Button>
          </Space>
        </div>
      ),
      onFilter: (value: string, record) =>
        record.hal.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Tanggal Dibuat",
      dataIndex: "createdAt",
      key: "tanggal_surat",
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
        const recordDate = new Date(record.createdAt);
        const startDate = new Date(value[0]);
        const endDate = new Date(value[1]);
        return recordDate >= startDate && recordDate <= endDate;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: "Disetujui", value: "diterima" },
        { text: "Ditolak", value: "ditolak" },
        { text: "Diproses", value: "diproses" },
        { text: "Belum Diproses", value: "belum_diproses" },
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
      } else if (access.isUPA) {
        role = 10;
      } else if (access.isSpvSda) {
        role = 27;
      }
      // console.log(role);

      // instead nip this is uuid
      const response = await axios.post<any>(
        `/v1/pengajuan/surat-keluar/role`,
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

      const responseHistory = await axios.post<any>(
        `/v1/pengajuan/surat-keluar/history/role`,
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
      setHistory(responseHistory.data.data);
      setData(response.data.data);
      setTotal(response.data.total);
      setTotalHistory(response.data.total);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination);
  }, [pagination.page, pagination.size]);

  const handleTableChange = (paginate: any) => {
    setPagination({
      page: paginate.current,
      size: paginate.pageSize,
    });
  };

  return (
    <>
      <Card title="Antrean Verifikasi Surat Keluar" style={{ marginBottom: 5 }}>
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
      <Card title="Daftar Surat Keluar" style={{ marginBottom: 5 }}>
        <Table
          dataSource={history}
          columns={columns}
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

export default SuratKeluarPage;
