'use client';

import { Stepper, type StepItem } from '@/components/ui/stepper';

interface ProgressStepperProps {
  currentStep: number;
  steps: { id: number; title: string; description: string }[];
}

export function ProgressStepper({ currentStep, steps }: ProgressStepperProps) {
  const stepItems: StepItem[] = steps.map((step) => ({
    key: String(step.id),
    label: step.title,
    description: step.description,
  }));

  // currentStep is 1-based (step.id), convert to 0-based index
  const activeIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <Stepper
      steps={stepItems}
      activeStep={activeIndex >= 0 ? activeIndex : 0}
    />
  );
}
