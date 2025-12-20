import { Card, Col, Row } from 'antd';
import { ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { Mahasiswa } from '@/utils/data';
import { FIELD_LABELS, PROGRAM_STUDI_OPTIONS } from '../constants';
import { requiredRule, getProgramStudiFromNIM, phoneNumberRule } from '../validation';
import useStyles from "../../../../form/advanced-form/style.style";


interface StudentDataFormProps {
  mahasiswa: Mahasiswa | undefined;
}

export function MahasiswaDataForm ({ 
  mahasiswa
} : StudentDataFormProps ) {
  const { styles } = useStyles();

  console.log(mahasiswa)

  return (
    <Card
      title="Data Mahasiswa"
      className={styles.card}
      variant="borderless"
      style={{ marginBottom: 16, width: '100%' }}
    >
      <Row gutter={16}>
        <Col span={24} lg={12} md={12} sm={24}>
          <ProFormText
            label={FIELD_LABELS.nama}
            name="nama"
            initialValue={mahasiswa?.user.name}
            disabled
            rules={[requiredRule()]}
            placeholder=""
          />
        </Col>
        <Col span={24} lg={12} md={12} sm={24}>
          <ProFormText
            label={FIELD_LABELS.nim}
            name="nim"
            initialValue={mahasiswa?.nim}
            disabled
            rules={[requiredRule()]}
            placeholder=""
          />
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={24} lg={12} md={12} sm={24}>
          <ProFormSelect
            label={FIELD_LABELS.program_studi}
            name="program_studi"
            initialValue={getProgramStudiFromNIM(mahasiswa?.nim || '')}
            rules={[{ required: true, message: 'Mohon dipilih' }]}
            options={PROGRAM_STUDI_OPTIONS}
            placeholder="Pilih Program Studi"
            disabled
          />
        </Col>
        
        <Col span={24} lg={12} md={12} sm={24}>
          <ProFormText
            label={FIELD_LABELS.no_hp}
            name="no_hp"
            rules={[
              requiredRule(),
              phoneNumberRule
            ]}
            placeholder="Contoh: 08123456789"
          />
        </Col>
        
        <Col span={24} lg={12} md={12} sm={24}>
          <ProFormText
            label={FIELD_LABELS.pengantar_untuk}
            name="pengantar_untuk"
            initialValue="Surat Pengantar Perkembangan Tugas Akhir"
            disabled
            rules={[requiredRule()]}
            placeholder=""
          />
        </Col>
        
        <Col span={24} lg={12} md={12} sm={24}>
          <ProFormText
            label={FIELD_LABELS.judul}
            name="judul"
            tooltip="Tuliskan judul lengkap tugas akhir Anda"
            rules={[requiredRule()]}
            placeholder="Masukkan judul tugas akhir"
          />
        </Col>
      </Row>
    </Card>
  );
};