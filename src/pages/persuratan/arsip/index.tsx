import React, { useEffect, useState } from 'react';
import { Card, message, Form, Input, Button, DatePicker, Select, Row, Col, Table, Typography, Space, Tag, Checkbox } from 'antd';
import { SearchOutlined, ReloadOutlined, FilterFilled } from '@ant-design/icons';
import { fetchArsipSurat, getAllTipeSurat, ArsipSuratFilterParams } from '@/services/persuratan/api';
import dayjs from 'dayjs';
import { history } from '@umijs/max';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const statusOptions = [
  // Status utama
  { label: 'Disetujui', value: 'DISETUJUI' },
  { label: 'Ditolak', value: 'DITOLAK' },
  { label: 'Revisi', value: 'REVISI' },
  { label: 'Penomoran', value: 'PENOMORAN' },
  
  // Status Verifikasi - Menunggu
  { label: 'Menunggu Verifikasi Dosen Pembimbing', value: 'MENUNGGU_VERIFIKASI_DOSEN_PEMBIMBING' },
  { label: 'Menunggu Verifikasi Dosen Koordinator', value: 'MENUNGGU_VERIFIKASI_DOSEN_KOORDINATOR' },
  { label: 'Menunggu Verifikasi Kaprodi', value: 'MENUNGGU_VERIFIKASI_KAPRODI' },
  { label: 'Menunggu Verifikasi Admin Departemen', value: 'MENUNGGU_VERIFIKASI_ADMIN_DEPARTEMEN' },
  { label: 'Menunggu Verifikasi Kadep', value: 'MENUNGGU_VERIFIKASI_KADEP' },
  { label: 'Menunggu Verifikasi Supervisor Akademik', value: 'MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK' },
  { label: 'Menunggu Verifikasi Supervisor Kemahasiswaan', value: 'MENUNGGU_VERIFIKASI_SUPERVISOR_KEMAHASISWAAN' },
  { label: 'Menunggu Verifikasi Manajer TU', value: 'MENUNGGU_VERIFIKASI_MANAJER_TU' },
  { label: 'Menunggu Verifikasi Petugas Akademik', value: 'MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK' },
  { label: 'Menunggu Verifikasi UPA', value: 'MENUNGGU_VERIFIKASI_UPA' },
  { label: 'Menunggu Verifikasi Pemohon', value: 'MENUNGGU_VERIFIKASI_PEMOHON' },
  { label: 'Menunggu Verifikasi Petugas TU', value: 'MENUNGGU_VERIFIKASI_PETUGAS_TU' },
  { label: 'Menunggu Verifikasi Sekretaris Kadep', value: 'MENUNGGU_VERIFIKASI_SEKRETARIS_KADEP' },
  { label: 'Menunggu Verifikasi Wakil Dekan 1', value: 'MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1' },
  { label: 'Menunggu Verifikasi Wakil Dekan 2', value: 'MENUNGGU_VERIFIKASI_WAKIL_DEKAN_2' },
  { label: 'Menunggu Verifikasi Dekan', value: 'MENUNGGU_VERIFIKASI_DEKAN' },
  
  // Status Surat Keluar - Menunggu Verifikasi
  { label: 'Surat Keluar Menunggu Verifikasi Supervisor Akademik', value: 'SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK' },
  { label: 'Surat Keluar Menunggu Verifikasi Supervisor Kemahasiswaan', value: 'SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_KEMAHASISWAAN' },
  { label: 'Surat Keluar Menunggu Verifikasi Dekan', value: 'SURAT_KELUAR_MENUNGGU_VERIFIKASI_DEKAN' },
  { label: 'Surat Keluar Menunggu Verifikasi Wakil Dekan 1', value: 'SURAT_KELUAR_MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1' },
  { label: 'Surat Keluar Menunggu Verifikasi Wakil Dekan 2', value: 'SURAT_KELUAR_MENUNGGU_VERIFIKASI_WAKIL_DEKAN_2' },
  { label: 'Surat Keluar Menunggu Verifikasi Manajer TU', value: 'SURAT_KELUAR_MENUNGGU_VERIFIKASI_MANAJER_TU' },
  { label: 'Surat Keluar Menunggu Verifikasi Petugas Akademik', value: 'SURAT_KELUAR_MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK' },
  { label: 'Surat Keluar Menunggu Verifikasi UPA', value: 'SURAT_KELUAR_MENUNGGU_VERIFIKASI_UPA' },
];

const departemenList = [
  { label: 'Informatika', value: 'Informatika' },
  { label: 'Fisika', value: 'Fisika' },
  { label: 'Kimia', value: 'Kimia' },
  { label: 'Biologi', value: 'Biologi' },
  { label: 'Statistika', value: 'Statistika' },
];

const getChecklistFilterDropdown = (data: any[], dataIndex: string) => ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => {
  const options = Array.from(new Set(data.map(item => item[dataIndex]))).filter(Boolean);
  return (
    <div style={{ padding: 8 }}>
      <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 8 }}>
        {options.map(option => (
          <div key={option}>
            <Checkbox
              checked={selectedKeys.includes(option)}
              onChange={e => {
                const checked = e.target.checked;
                if (checked) {
                  setSelectedKeys([...selectedKeys, option]);
                } else {
                  setSelectedKeys(selectedKeys.filter((k: any) => k !== option));
                }
              }}
            >
              {option}
            </Checkbox>
          </div>
        ))}
      </div>
      <Button
        type="primary"
        onClick={confirm}
        size="small"
        style={{ width: 90, marginRight: 8 }}
      >
        Terapkan
      </Button>
      <Button onClick={clearFilters} size="small" style={{ width: 90 }}>
        Reset
      </Button>
    </div>
  );
};

const ArsipSuratPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });
  const [filter, setFilter] = useState<ArsipSuratFilterParams>({});
  const [tipeSuratOptions, setTipeSuratOptions] = useState<any[]>([
    { label: 'Surat Pengantar', value: 'ak15' },
    { label: 'SKL (Surat Keterangan Lulus)', value: 'ak8' },
    { label: 'Surat Rekomendasi Beasiswa', value: 'srb' },
    { label: 'Surat Pernyataan Masih Kuliah', value: 'ak006' },
    { label: 'Surat Keterangan Mahasiswa', value: 'ak007' },
    { label: 'Surat Pengantar Perkembangan Tugas Akhir', value: 'sppta' },
  ]);
  const [form] = Form.useForm();

  const fetchTipeSurat = async () => {
    try {
      const res = await getAllTipeSurat();
      const data = res.data as any;
      
      // Handle multiple possible response structures
      let masterSuratList = [];
      
      if (data && Array.isArray(data)) {
        // Direct array response
        masterSuratList = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        // Nested data response
        masterSuratList = data.data;
      } else if (data && data.result && Array.isArray(data.result)) {
        // Result field response
        masterSuratList = data.result;
      }
      
      if (masterSuratList.length > 0) {
        const options = masterSuratList.map((item: any) => {
          // Try multiple field name possibilities
          const label = item.nama_surat || item.namaSurat || item.name || item.title || item.type || `Tipe ${item.id}`;
          const value = item.id || item.value || item.code;
          
          return {
            label,
            value,
          };
        }).filter((option: any) => option.value); // Filter out items without valid value
        
        setTipeSuratOptions(options);
      } else {
        // If API returns empty or no valid data, use fallback
        setTipeSuratOptions(getFallbackTipeSurat());
      }
    } catch (err) {
      // Always provide fallback data if API fails
      setTipeSuratOptions(getFallbackTipeSurat());
    }
  };

  const getFallbackTipeSurat = () => [
    { label: 'Surat Pengantar', value: 'ak15' },
    { label: 'SKL (Surat Keterangan Lulus)', value: 'ak8' },
    { label: 'Surat Rekomendasi Beasiswa', value: 'srb' },
    { label: 'Surat Pernyataan Masih Kuliah', value: 'ak006' },
    { label: 'Surat Keterangan Mahasiswa', value: 'ak007' },
    { label: 'Surat Pengantar Perkembangan Tugas Akhir', value: 'sppta' },
  ];

  const fetchData = async (params: ArsipSuratFilterParams) => {
    setLoading(true);
    try {
      const res = await fetchArsipSurat(params);
      const data = res.data as any;
      setData(data.data || []);
      setPagination((prev) => ({ ...prev, total: data.pagination?.totalItems || 0 }));
    } catch (err) {
      message.error('Gagal mengambil data arsip');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTipeSurat();
  }, []);

  useEffect(() => {
    fetchData({ ...filter, page: pagination.page, size: pagination.size });
    // eslint-disable-next-line
  }, [pagination.page, pagination.size, filter]);
  const handleTableChange = (pag: any, filters: any, sorter: any) => {
    setPagination((prev) => ({ ...prev, page: pag.current, size: pag.pageSize }));
    
    // Merge table column filters dengan form filters yang sudah ada
    const filterParams: any = { ...filter };
    
    // Update hanya filter yang berasal dari table columns
    // Jangan hapus filter dari form
    if (filters && Object.keys(filters).length > 0) {
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key].length > 0) {
          filterParams[key] = filters[key];
        } else if (filters[key] === null || (Array.isArray(filters[key]) && filters[key].length === 0)) {
          // Only delete table column filters, not form filters
          if (['jenis_surat', 'nama_pemohon', 'nim', 'departemen', 'status_terakhir'].includes(key)) {
            delete filterParams[key];
          }
        }
      });
    }

    // Handle sorting
    if (sorter.field && sorter.order) {
      filterParams.sortField = sorter.field;
      filterParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
    } else {
      delete filterParams.sortField;
      delete filterParams.sortOrder;
    }

    setFilter(filterParams);
  };
  const onFinish = (values: any) => {
    const { tanggal, status, departemen, ...rest } = values;
    const filterParams: ArsipSuratFilterParams = { ...rest };
    if (tanggal && tanggal.length === 2) {
      filterParams.tanggal_mulai = dayjs(tanggal[0]).format('YYYY-MM-DD');
      filterParams.tanggal_selesai = dayjs(tanggal[1]).format('YYYY-MM-DD');
    }
    if (status && status.length > 0) {
      filterParams.status = status; // langsung array
    } else {
      filterParams.status = undefined;
    }
    if (departemen) {
      filterParams.departemen = departemen;
    } else {
      filterParams.departemen = undefined;
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilter(filterParams);
  };

  const onReset = () => {
    form.resetFields();
    setFilter({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getStatusTag = (status: string) => {
    if (!status) return null;
    
    // HANYA 3 WARNA: hijau untuk DISETUJUI, merah untuk DITOLAK, abu-abu untuk sisanya
    let color: string;
    
    if (status.includes('DISETUJUI')) {
      color = 'green';
        } 
    else if (status.includes('DITOLAK') || status.includes('REVISI')) {
      color = 'red';
    } else {
      color = 'default'; // Abu-abu untuk semua status lainnya
    }
    
    // Mapping untuk text yang lebih singkat (tanpa mempengaruhi warna)
    const statusTextMap: Record<string, string> = {
      // Status utama
      'DISETUJUI': 'Disetujui',
      'DITOLAK': 'Ditolak',
      'REVISI': 'Revisi',
      
      // Status Menunggu Verifikasi
      'MENUNGGU_VERIFIKASI_DOSEN_PEMBIMBING': 'Menunggu Dospem',
      'MENUNGGU_VERIFIKASI_DOSEN_KOORDINATOR': 'Menunggu Doskor',
      'MENUNGGU_VERIFIKASI_KAPRODI': 'Menunggu Kaprodi',
      'MENUNGGU_VERIFIKASI_ADMIN_DEPARTEMEN': 'Menunggu Admin Dept',
      'MENUNGGU_VERIFIKASI_KADEP': 'Menunggu Kadep',
      'MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK': 'Menunggu Supervisor',
      'MENUNGGU_VERIFIKASI_SUPERVISOR_KEMAHASISWAAN': 'Menunggu Sup. Kemahasiswaan',
      'MENUNGGU_VERIFIKASI_MANAJER_TU': 'Menunggu Manajer TU',
      'MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK': 'Menunggu Petugas',
      'MENUNGGU_VERIFIKASI_UPA': 'Menunggu UPA',
      'MENUNGGU_VERIFIKASI_PEMOHON': 'Menunggu Pemohon',
      'MENUNGGU_VERIFIKASI_PETUGAS_TU': 'Menunggu Petugas TU',
      'MENUNGGU_VERIFIKASI_SEKRETARIS_KADEP': 'Menunggu Sekretaris Kadep',
      'MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1': 'Menunggu Wadek 1',
      'MENUNGGU_VERIFIKASI_WAKIL_DEKAN_2': 'Menunggu Wadek 2',
      'MENUNGGU_VERIFIKASI_DEKAN': 'Menunggu Dekan',
      
      // Status Surat Keluar - Menunggu Verifikasi
      'SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_AKADEMIK': 'SK Menunggu Supervisor',
      'SURAT_KELUAR_MENUNGGU_VERIFIKASI_SUPERVISOR_KEMAHASISWAAN': 'SK Menunggu Sup. Kemahasiswaan',
      'SURAT_KELUAR_MENUNGGU_VERIFIKASI_DEKAN': 'SK Menunggu Dekan',
      'SURAT_KELUAR_MENUNGGU_VERIFIKASI_WAKIL_DEKAN_1': 'SK Menunggu Wadek 1',
      'SURAT_KELUAR_MENUNGGU_VERIFIKASI_WAKIL_DEKAN_2': 'SK Menunggu Wadek 2',
      'SURAT_KELUAR_MENUNGGU_VERIFIKASI_MANAJER_TU': 'SK Menunggu Manajer TU',
      'SURAT_KELUAR_MENUNGGU_VERIFIKASI_PETUGAS_AKADEMIK': 'SK Menunggu Petugas',
      'SURAT_KELUAR_MENUNGGU_VERIFIKASI_UPA': 'SK Menunggu UPA',
      
    
    };
    
    const text = statusTextMap[status] || status;
    
    return (
      <Tag color={color} style={{fontSize: 12, borderRadius: 4, padding: '0 8px', lineHeight: '20px', height: 22 }}>
        {text}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'No',
      dataIndex: 'id_pengajuan',
      width: 70,
      sorter: (a: any, b: any) => a.id_pengajuan - b.id_pengajuan,
      showSorterTooltip: false,
      render: (_: any, __: any, index: number) => (
        <span style={{ fontSize: '13px' }}>
          {index + 1 + (pagination.page - 1) * pagination.size}
        </span>
      ),
    },
    {
      title: 'Surat',
      dataIndex: 'jenis_surat',
      width: 200,
      ellipsis: true,
      sorter: (a: any, b: any) => (a.jenis_surat || '').localeCompare(b.jenis_surat || ''),
      showSorterTooltip: false,
      filterDropdown: getChecklistFilterDropdown(data, 'jenis_surat'),
      filterIcon: (filtered: any) => <FilterFilled style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value: any, record: any) => record.jenis_surat === value,
      render: (text: string) => <span style={{ fontSize: '13px' }}>{text}</span>
    },
    {
      title: 'Pengirim',
      dataIndex: 'nama_pemohon',
      width: 180,
      ellipsis: true,
      sorter: (a: any, b: any) => (a.nama_pemohon || '').localeCompare(b.nama_pemohon || ''),
      showSorterTooltip: false,
      filterDropdown: getChecklistFilterDropdown(data, 'nama_pemohon'),
      filterIcon: (filtered: any) => <FilterFilled style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value: any, record: any) => record.nama_pemohon === value,
      render: (text: string) => <span style={{ fontSize: '13px' }}>{text}</span>
    },
    {
      title: 'NIM',
      dataIndex: 'nim',
      width: 140,
      ellipsis: true,
      sorter: (a: any, b: any) => (a.nim || '').localeCompare(b.nim || ''),
      showSorterTooltip: false,
      filterDropdown: getChecklistFilterDropdown(data, 'nim'),
      filterIcon: (filtered: any) => <FilterFilled style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value: any, record: any) => record.nim === value,
      render: (text: string) => <span style={{ fontSize: '13px' }}>{text || '-'}</span>
    },
    {
      title: 'Prodi/Departemen',
      dataIndex: 'departemen',
      width: 180,
      ellipsis: true,
      sorter: (a: any, b: any) => {
        const deptA = typeof a.departemen === 'object' ? a.departemen?.nama_departemen : a.departemen;
        const deptB = typeof b.departemen === 'object' ? b.departemen?.nama_departemen : b.departemen;
        return (deptA || '').localeCompare(deptB || '');
      },
      showSorterTooltip: false,
      filterDropdown: getChecklistFilterDropdown(
        data.map(item => ({
          ...item,
          departemen: typeof item.departemen === 'object' ? item.departemen?.nama_departemen : item.departemen
        })),
        'departemen'
      ),
      filterIcon: (filtered: any) => <FilterFilled style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value: any, record: any) => {
        const dept = typeof record.departemen === 'object' ? record.departemen?.nama_departemen : record.departemen;
        return dept === value;
      },
      render: (text: any) => {
        const deptName = typeof text === 'object' ? text?.nama_departemen : text;
        return <span style={{ fontSize: '13px' }}>{deptName || '-'}</span>;
      }
    },
    {
      title: 'Tanggal Masuk',
      dataIndex: 'tanggal_pengajuan',
      width: 120,
      sorter: (a: any, b: any) => dayjs(a.tanggal_pengajuan).unix() - dayjs(b.tanggal_pengajuan).unix(),
      showSorterTooltip: false,
      render: (val: string) => <span style={{ fontSize: '13px' }}>{val ? dayjs(val).format('DD/MM/YYYY') : '-'}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status_terakhir',
      width: 150,
      sorter: (a: any, b: any) => (a.status_terakhir || '').localeCompare(b.status_terakhir || ''),
      showSorterTooltip: false,
      filterDropdown: getChecklistFilterDropdown(data, 'status_terakhir'),
      filterIcon: (filtered: any) => <FilterFilled style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value: any, record: any) => record.status_terakhir === value,
      render: (status: any) => getStatusTag(status),
    },
    {
      title: 'Aksi',
      key: 'action',
      fixed: 'right' as const,
      width: 100,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => history.push('/persuratan/arsip/detail-surat', record)}>
            Detail
          </Button>
        </Space>
      ),
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="content-container">
        {/* Fillter Arsip Surat */}
        <Card
          className="filter-card"          
          title={
            <div>
              <Title level={5} style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Filter Pencarian</Title>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ width: '100%' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={8}>
                <Card
                  size="small"
                  title={<span style={{ fontSize: '13px', fontWeight: 500 }}>Informasi Pemohon</span>}
                  style={{ height: '100%', background: '#fff' }}
                  headStyle={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
                  
                > 
                  {/* Nama Pemohon */}
                  <Form.Item name="nama_pemohon" label="Nama Pemohon">
                    <Input
                      placeholder="Masukkan nama pemohon"
                      prefix={<SearchOutlined className="site-form-item-icon" />}
                      allowClear
                      size="middle"
                    />
                  </Form.Item>

                  {/* Prodi / Departemen */}
                  <Form.Item name="departemen" label="Prodi/Departemen">
                    <Select
                      allowClear
                      showSearch
                      options={departemenList}
                      placeholder="Pilih departemen"
                      prefix={<SearchOutlined className="site-form-item-icon" />}
                      size="middle"
                      filterOption={(input, option) =>
                        (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>

                  {/* NIM Pemohon */}
                  <Form.Item 
                    name="nim_pemohon" 
                    label="NIM Pemohon"
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="Masukkan NIM pemohon"
                      prefix={<SearchOutlined className="site-form-item-icon" />}
                      allowClear
                      size="middle"
                    />
                  </Form.Item>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card
                  size="small"
                  title={<span style={{ fontSize: '13px', fontWeight: 500 }}>Informasi Surat</span>}
                  style={{ height: '100%', background: '#fff' }}
                  headStyle={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
                >
                  <Form.Item name="tipe_suratId" label="Tipe Surat">
                    <Select
                      allowClear
                      options={tipeSuratOptions.length > 0 ? tipeSuratOptions : [
                        { label: 'Surat Pengantar', value: 'ak15' },
                        { label: 'SKL (Surat Keterangan Lulus)', value: 'ak8' },
                        { label: 'Surat Rekomendasi Beasiswa', value: 'srb' },
                        { label: 'Surat Pernyataan Masih Kuliah', value: 'ak006' },
                        { label: 'Surat Keterangan Mahasiswa', value: 'ak007' },
                        { label: 'Surat Pengantar Perkembangan Tugas Akhir', value: 'sppta' },
                      ]}
                      placeholder="Pilih tipe surat"
                      showSearch
                      size="middle"
                      notFoundContent="Tidak ada data tipe surat"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                  <Form.Item 
                    name="status" 
                    label="Status"
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      mode="multiple"
                      allowClear
                      options={statusOptions}
                      placeholder="Pilih status"
                      maxTagCount={2}
                      size="middle"
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      optionFilterProp="label"
                    />
                  </Form.Item>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card
                  size="small"
                  title={<span style={{ fontSize: '13px', fontWeight: 500 }}>Periode Waktu</span>}
                  style={{ height: '100%', background: '#fff' }}
                  headStyle={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
                >
                  <Form.Item 
                    name="tanggal" 
                    label="Tanggal Pengajuan"
                    style={{ marginBottom: 0 }}
                  >
                    <RangePicker
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      size="middle"
                    />
                  </Form.Item>
                </Card>
              </Col>            
            </Row>
            <div style={{ marginTop: 24, paddingLeft: 1 }}>
              <Space size="middle">
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={onReset}
                  style={{ 
                    minWidth: '100px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Reset
                </Button>
                <Button
                  type="primary"
                  size="small"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  style={{ 
                    minWidth: '100px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Cari
                </Button>
              </Space>
            </div>
          </Form>
        </Card>    
        
        {/* Tabel Arsip Surat */}
        <Card 
          className="table-card"
          style={{ 
            marginTop: 24,
            background: '#fff',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
          }}
            title={
            <div>
              <Title level={5} style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Tabel Arsip Surat</Title>
            </div>
          }
        >
          <Table
            size="small"
            className="custom-table"
            dataSource={data}
            columns={columns}
            loading={loading}
            rowKey="id_pengajuan"
            scroll={{ x: 'max-content' }}
            pagination={{
              total: pagination.total,
              pageSize: pagination.size,
              current: pagination.page,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} data`,
              position: ['bottomRight']
            }}
            onChange={handleTableChange}
          />
        </Card>
      </div>      
    </div>
  );
};

export default ArsipSuratPage;