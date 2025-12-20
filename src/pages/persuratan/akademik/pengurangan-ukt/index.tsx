import { PageContainer, StepsForm } from "@ant-design/pro-components";
import { Button, FormInstance, Space, Spin } from "antd";
import { useState, useRef, useEffect } from "react";
import { DocumentUploadForm } from "./components/DocumentUploadForm";
import { SubmissionData, useApplicationSubmission } from "./hooks/useApplicationSubmission";
import { RevisionNoticeCard } from "./components/RevisionNoticeCard";
import { InformationCard } from "./components/InformationCard";
import { MahasiswaDataForm } from "./components/MahasiswaDataForm";
import { useExistingApplication } from "./hooks/useExistingApplication";
import { ERole } from "@/access";
import { useAllPegawaiData } from "@/hooks/fetchPegawaiData";
import { useCurrentMahasiswa } from "@/hooks/fetchMahasiswa";
import { Mahasiswa } from "@/utils/data";
import { DosbingSelectionForm } from "./components/DosbingSelectionForm";
import { Pegawai } from "@/utils/parseStateSurat";
import { useCurrentKaprodi } from "./hooks/useCurrentKaprodi";
import { SubmissionSuccessCard } from "./components/SubmissionSuccessCard";

const FormPerkembanganTugasAkhir: React.FC = () => {
  const mahasiswaState = useCurrentMahasiswa();
  const { dataPegawai } = useAllPegawaiData(ERole.DOSEN_PEMBIMBING);
  const { existingApplication, isRevisionNeeded } = useExistingApplication();
  const { submitApplication, loading, submittedId } = useApplicationSubmission();

  const [current, setCurrent] = useState(0);
  const [fileUploads, setFileUploads] = useState({});
  const formRef = useRef<FormInstance>();
  const kaprodiState = useCurrentKaprodi(mahasiswaState);

  // Handlers
  const handleSubmit = async (values: any) => {
    const result = await submitApplication({
      values,
      fileUploads,
      kaprodi: kaprodiState.data
    });

    if (result) {
      setCurrent(1);
    }
  };

  useEffect(() => {
    if (existingApplication) {
      setCurrent(1);
    }
  }, [existingApplication]);


  if (mahasiswaState.isLoading) {
    return <Spin />
  }

  const CustomSubmitter = ({ form, onSubmit }: any) => {
      return (
        <Button
          type="primary"
          onClick={async () => {
            try {
              await form?.validateFields();
              form?.submit();
            } catch (error) {
              console.error("Form validation failed:", error);
            }
          }}
        >
          Kirim
        </Button>
      );
    };

  return (
    <PageContainer>
      <StepsForm
        current={current}
        onCurrentChange={setCurrent}
        submitter={{
          render: (props, _dom) => {
            if (props.step === 0) {
              return (
                <CustomSubmitter form={props.form} onSubmit={props.onSubmit} />
              );
            }
            return null;
          },
        }}
        >
        <StepsForm.StepForm
          title="Isi Form Surat Pengantar Perkembangan Tugas Akhir"
          onFinish={handleSubmit}>
          {isRevisionNeeded && <RevisionNoticeCard keterangan_surat={existingApplication?.keterangan_surat ?? ""} />}

          <InformationCard />
          <MahasiswaDataForm mahasiswa={mahasiswaState.data as Mahasiswa} />
          <DocumentUploadForm onFilesChange={setFileUploads} />
          <DosbingSelectionForm
            daftarDosenPembimbing={dataPegawai as unknown as Pegawai[]}
          />
        </StepsForm.StepForm>

        <StepsForm.StepForm title="Success">
          <SubmissionSuccessCard
            suratId={submittedId || existingApplication?.id || ""}
          />
        </StepsForm.StepForm>
      </StepsForm>

    </PageContainer>
  );
};

export default FormPerkembanganTugasAkhir;