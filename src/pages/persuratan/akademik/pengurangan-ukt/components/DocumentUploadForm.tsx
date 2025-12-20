import { Button, Card, Col, Form, Row, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useFileUpload } from '../hooks/useFileUpload';
import { useEffect } from 'react';

interface DocumentUploadFormProps {
  className?: string;
  onFilesChange?: (files: {
    lampiranTugasAkhir: string[];
    suratPermohonan: string[];
    suratKeteranganLulus: string[];
    buktiBayarUkt: string[];
    fotoBukuRekening: string[];
  }) => void;
}

export function DocumentUploadForm({ 
  className,
  onFilesChange 
} : DocumentUploadFormProps) {
  const lampiranTA = useFileUpload();
  const suratPermohonan = useFileUpload();
  const suratKeteranganLulus = useFileUpload();
  const buktiBayarUkt = useFileUpload();
  const fotoBukuRekening = useFileUpload();

  // Notify parent of file changes
  useEffect(() => {
    onFilesChange?.({
      lampiranTugasAkhir: lampiranTA.uploadedFilenames,
      suratPermohonan: suratPermohonan.uploadedFilenames,
      suratKeteranganLulus: suratKeteranganLulus.uploadedFilenames,
      buktiBayarUkt: buktiBayarUkt.uploadedFilenames,
      fotoBukuRekening: fotoBukuRekening.uploadedFilenames,
    });
  }, [
    lampiranTA.uploadedFilenames,
    suratPermohonan.uploadedFilenames,
    suratKeteranganLulus.uploadedFilenames,
    buktiBayarUkt.uploadedFilenames,
    fotoBukuRekening.uploadedFilenames,
  ]);

  return (
    <>
      {/* Main Document Upload */}
      <Card
        title="Upload Berkas"
        className={className}
        variant="borderless"
        style={{ marginBottom: 16, width: '100%' }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <p>
              <strong>Lampiran Tugas Akhir</strong>
              <br />
              Format PDF maksimum size file 10 MB
            </p>
            <Form.Item
              label="Upload Tugas Akhir"
              required
              tooltip="File PDF maksimum size 10 MB"
            >
              <Upload {...lampiranTA.uploadProps}>
                <Button icon={<UploadOutlined />}>Select File PDF</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Additional Required Documents */}
      <Card
        title="Berkas Persyaratan"
        className={className}
        variant="borderless"
        style={{ marginBottom: 16, width: '100%' }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <p>
              Unggah keempat berkas persyaratan berikut (PDF, maks 10 MB per berkas). 
              Semua berkas akan disertakan sebagai lampiran pengajuan.
            </p>
          </Col>
          
          <Col span={24} lg={12} md={12} sm={24}>
            <Form.Item label="Surat Permohonan (WR II)">
              <Upload {...suratPermohonan.uploadProps}>
                <Button icon={<UploadOutlined />}>Pilih PDF</Button>
              </Upload>
            </Form.Item>
          </Col>
          
          <Col span={24} lg={12} md={12} sm={24}>
            <Form.Item label="Surat Keterangan Lulus">
              <Upload {...suratKeteranganLulus.uploadProps}>
                <Button icon={<UploadOutlined />}>Pilih PDF</Button>
              </Upload>
            </Form.Item>
          </Col>
          
          <Col span={24} lg={12} md={12} sm={24}>
            <Form.Item label="Bukti Bayar UKT Semester Ini">
              <Upload {...buktiBayarUkt.uploadProps}>
                <Button icon={<UploadOutlined />}>Pilih PDF</Button>
              </Upload>
            </Form.Item>
          </Col>
          
          <Col span={24} lg={12} md={12} sm={24}>
            <Form.Item label="Foto Buku Rekening">
              <Upload {...fotoBukuRekening.uploadProps}>
                <Button icon={<UploadOutlined />}>Pilih PDF</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </>
  );
};