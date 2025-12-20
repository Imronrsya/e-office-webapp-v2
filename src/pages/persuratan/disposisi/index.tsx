import { formatTanggal } from "@/pages/components/FormatTanggalUmumIndo";
import { getStatusTag } from "@/pages/components/StatusTag";
import { SuratData } from "@/services/persuratan/api";
import { AxiosService } from "@/utils/axios";
import { PaginationParams } from "@/utils/data";
import { Link, useAccess, useModel } from "@umijs/max";
import { Table, Tag } from "antd";
import { useEffect, useState } from "react";

const SuratMasuk = () => {
  const [data, setData] = useState<SuratData[]>([]);
  const { initialState } = useModel("@@initialState");
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    size: 5,
  });
  const [total, setTotal] = useState(0);

  const columns = [
    {
      title: "No",
      render: (_: any, __: any, index: number) =>
        (pagination.page - 1) * pagination.size + index + 1,
    },
    {
      title: "Surat",
      dataIndex: ["surat", "tipe_surat", "nama_surat"],
      key: "surat",
    },
    {
      title: "Tanggal Disposisi",
      dataIndex: "createdAt",
      key: "tanggal_pengajuan",
      render: (tanggal: string) => formatTanggal(tanggal),
    },
    {
      title: "Keterangan",
      dataIndex: "keterangan",
      key: "keterangan",
    },
    {
      title: "Aksi",
      key: "action",
      dataIndex: "id",
      render: (id: string) => {
        return <Link to={`/disposisi/disposisi-detail/${id}`}>Detail</Link>;
      },
    },
  ];

  const fetchData = async (params: PaginationParams) => {
    try {
      setIsLoading(true);

      const axios = new AxiosService();

      const currentUser = initialState?.currentUser;

      // instead nip this is uuid
      const response = await axios.get<any>(
        `/v1/pengajuan/disposisi/nip/${currentUser?.userid}`,
        {
          params: {
            page: params.page,
            size: params.size,
          },
        },
      );
      // console.log(response.data)
      setData(response.data.data);
      setTotal(response.data.totalItems);
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
  );
};

export default SuratMasuk;
