import { User } from "@/utils/data";
import { useStyle, ProFormSelect } from "@ant-design/pro-components";
import { FormInstance, Card, Row, Col } from "antd";
import useStyles from "../../../../form/advanced-form/style.style";
import { useForm } from "antd/es/form/Form";
import { Pegawai } from "@/utils/parseStateSurat";


export function DosbingSelectionForm(
  {daftarDosenPembimbing}: {daftarDosenPembimbing : Pegawai[]}) {

  const { styles } = useStyles();
  const [formRef]  = useForm();

  return <Card
    title="Dosen Pembimbing "
    className={styles.card}
    variant="borderless"
    style={{ marginBottom: 16, width: "100%" }}
  >
    <Row gutter={16}>
      <Col span={24} lg={12} md={12} sm={24}>
        <ProFormSelect
          label="Pembimbing 1"
          name="pembimbing1_uuid"
          placeholder="Pilih Dosen Pembimbing 1"
          options={daftarDosenPembimbing?.map((d) => ({
            label: d.name,
            value: JSON.stringify({
              uuid: d.uuid,
              nama: d.name,
              nip: d.Pegawai?.nip,
              program_studi: d.Pegawai?.id_prodi
                ? (d.Pegawai?.id_prodi).toString()
                : "",
              no_hp: d.Pegawai?.no_hp == null ? "" : d.Pegawai?.no_hp,
            }),
          }))}
          fieldProps={{
            showSearch: true,
            filterOption: (input: string, option: any) => {
              const label = option?.label?.toString().toLowerCase() || "";
              return label.includes(input.toLowerCase());
            },
          }}
          rules={[
            {
              validator: async (_, value) => {
                const pemb2 = formRef.current?.getFieldValue("pembimbing2_uuid");
                if (value && pemb2 && value === pemb2) {
                  return Promise.reject(
                    new Error(
                      "Pembimbing 1 dan Pembimbing 2 tidak boleh sama"
                    )
                  );
                }
                return Promise.resolve();
              },
            },
          ]} />
      </Col>
      <Col span={24} lg={12} md={12} sm={24}>
        <ProFormSelect
          label="Pembimbing 2"
          name="pembimbing2_uuid"
          placeholder="Pilih Dosen Pembimbing 2"
          options={daftarDosenPembimbing?.map((d) => ({
            label: d.name,
            value: JSON.stringify({
              uuid: d.uuid,
              nama: d.name,
              nip: d.Pegawai?.nip,
              program_studi: d.Pegawai?.id_prodi
                ? (d.Pegawai?.id_prodi).toString()
                : "",
              no_hp: d.Pegawai?.no_hp == null ? "" : d.Pegawai?.no_hp,
            }),
          }))}
          fieldProps={{
            showSearch: true,
            filterOption: (input: string, option: any) => {
              const label = option?.label?.toString().toLowerCase() || "";
              return label.includes(input.toLowerCase());
            },
          }}
          rules={[
            {
              validator: async (_, value) => {
                const pemb1 = formRef.current?.getFieldValue("pembimbing1_uuid");
                if (value && pemb1 && value === pemb1) {
                  return Promise.reject(
                    new Error(
                      "Pembimbing 1 dan Pembimbing 2 tidak boleh sama"
                    )
                  );
                }
                return Promise.resolve();
              },
            },
          ]} />
      </Col>
    </Row>
  </Card>;
}
