'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TEMPLATE_CONFIGS, TemplateType } from '@/lib/templates';
import { useDraftSurat } from '../../context/draft-surat-context';
import { FileText, ClipboardList, Table, Award, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  FileText,
  ClipboardList,
  Table,
  Award,
};

interface TemplateSelectionStepProps {
  userRole: 'admin-prodi' | 'staf' | 'supervisor';
}

export function TemplateSelectionStep({ userRole }: TemplateSelectionStepProps) {
  const { state, setSelectedTemplate, nextStep } = useDraftSurat();

  // Filter templates based on user role
  const availableTemplates = TEMPLATE_CONFIGS.filter(template =>
    template.availableFor.includes(userRole)
  );

  const handleSelectTemplate = (templateId: TemplateType) => {
    setSelectedTemplate(templateId);
    nextStep();
  };

  // If admin-prodi, auto-select surat-pengantar and go to next step
  if (userRole === 'admin-prodi' && availableTemplates.length === 1) {
    // Auto-proceed after render
    if (!state.selectedTemplate) {
      setTimeout(() => {
        setSelectedTemplate('surat-pengantar');
        nextStep();
      }, 100);
    }
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat template surat pengantar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Pilih Jenis Surat</h2>
        <p className="text-muted-foreground mt-1">
          Pilih template surat yang akan Anda buat
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableTemplates.map((template) => {
          const IconComponent = iconMap[template.icon as keyof typeof iconMap] || FileText;
          const isSelected = state.selectedTemplate === template.id;

          return (
            <Card
              key={template.id}
              className={cn(
                'cursor-pointer transition-all hover:border-primary hover:shadow-md',
                isSelected && 'border-primary ring-2 ring-primary/20'
              )}
              onClick={() => handleSelectTemplate(template.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{template.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
