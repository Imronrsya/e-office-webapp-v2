'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// STEPPER - Material Tailwind style, using project design tokens
// Colors: base-black (#2B2B2B) for active, base-gray (#6D6D6D) for inactive
// ============================================================================

export interface StepItem {
  key: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface StepperProps {
  steps: StepItem[];
  activeStep: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

export function Stepper({ steps, activeStep, onStepClick, className }: StepperProps) {
  const visibleSteps = steps.filter((s) => !s.disabled);

  // Inline color constants to avoid Tailwind v4 CSS variable resolution issues
  const COLORS = {
    active: '#2B2B2B',    // base-black
    inactive: '#6D6D6D',  // base-gray
    line: '#E1DFE0',      // base-gray-light
  } as const;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center w-full">
        {visibleSteps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          const isLast = index === visibleSteps.length - 1;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.key}>
              {/* Step */}
              <div
                className={cn(
                  'flex flex-col items-center relative',
                  onStepClick && 'cursor-pointer'
                )}
                onClick={() => onStepClick?.(index)}
              >
                {/* Circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2"
                  style={{
                    backgroundColor: isCompleted ? COLORS.active : '#FFFFFF',
                    borderColor: isCompleted || isActive ? COLORS.active : COLORS.line,
                    color: isCompleted ? '#FFFFFF' : isActive ? COLORS.active : COLORS.inactive,
                    ...(isActive ? { boxShadow: `0 0 0 4px ${COLORS.active}20` } : {}),
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : Icon ? (
                    <Icon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Label & Description (below circle) */}
                <div className="mt-3 text-center w-max">
                  <p
                    className="text-sm font-semibold transition-colors duration-300"
                    style={{
                      color: isActive || isCompleted ? COLORS.active : COLORS.inactive,
                    }}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p
                      className="text-xs mt-0.5 transition-colors duration-300"
                      style={{
                        color: COLORS.inactive,
                      }}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 mx-2 -mt-6">
                  <div
                    className="h-0.5 w-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: isCompleted ? COLORS.active : COLORS.line,
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// STEPPER SKELETON - Loading state
// ============================================================================

interface StepperSkeletonProps {
  stepCount?: number;
  className?: string;
}

export function StepperSkeleton({ stepCount = 4, className }: StepperSkeletonProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center w-full">
        {Array.from({ length: stepCount }).map((_, index) => {
          const isLast = index === stepCount - 1;
          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-zinc-200 animate-pulse" />
                <div className="mt-3 flex flex-col items-center gap-1">
                  <div className="h-4 w-16 bg-zinc-200 rounded animate-pulse" />
                </div>
              </div>
              {!isLast && (
                <div className="flex-1 mx-2 -mt-6">
                  <div className="h-0.5 w-full bg-zinc-200 rounded-full animate-pulse" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
