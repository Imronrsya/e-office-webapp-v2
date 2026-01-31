'use client';

import { DraftSuratProvider, useDraftSurat } from './context/draft-surat-context';
import { ProgressStepper } from './components/progress-stepper';
import { TemplateSelectionStep } from './components/steps/template-selection-step';
import { FormEditorStep } from './components/steps/form-editor-step';
import { TembusanConfigStep } from './components/steps/tembusan-config-step';
import { SignerConfigStep } from './components/steps/signer-config-step';
import { SignaturePositionStep } from './components/steps/signature-position-step';
import { Card, CardContent } from '@/components/ui/card';

const STEPS = [
  { id: 1, title: 'Pilih Template', description: 'Pilih jenis surat' },
  { id: 2, title: 'Isi Data', description: 'Lengkapi form surat' },
  { id: 3, title: 'Tembusan', description: 'Konfigurasi penerima' },
  { id: 4, title: 'Penandatangan', description: 'Tambah pejabat' },
  { id: 5, title: 'Posisi TTD', description: 'Atur posisi' },
];

interface DraftSuratPageContentProps {
  userRole: 'admin-prodi' | 'staf' | 'supervisor';
}

function DraftSuratPageContent({ userRole }: DraftSuratPageContentProps) {
  const { state } = useDraftSurat();

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <TemplateSelectionStep userRole={userRole} />;
      case 2:
        return <FormEditorStep />;
      case 3:
        return <TembusanConfigStep />;
      case 4:
        return <SignerConfigStep />;
      case 5:
        return <SignaturePositionStep />;
      default:
        return <TemplateSelectionStep userRole={userRole} />;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <Card className="mb-6">
        <CardContent className="pt-6">
          <ProgressStepper currentStep={state.currentStep} steps={STEPS} />
        </CardContent>
      </Card>

      <div className="min-h-[500px]">
        {renderStep()}
      </div>
    </div>
  );
}

interface DraftSuratPageProps {
  userRole?: 'admin-prodi' | 'staf' | 'supervisor';
}

export function DraftSuratPage({ userRole = 'staf' }: DraftSuratPageProps) {
  return (
    <DraftSuratProvider>
      <DraftSuratPageContent userRole={userRole} />
    </DraftSuratProvider>
  );
}

// Export components for use elsewhere
export { DraftSuratProvider, useDraftSurat } from './context/draft-surat-context';
export { ProgressStepper } from './components/progress-stepper';
export { TemplateSelectionStep } from './components/steps/template-selection-step';
export { FormEditorStep } from './components/steps/form-editor-step';
export { TembusanConfigStep } from './components/steps/tembusan-config-step';
export { SignerConfigStep } from './components/steps/signer-config-step';
export { SignaturePositionStep } from './components/steps/signature-position-step';
