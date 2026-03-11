'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/features/auth/hooks/use-auth';

// Dynamically import the DraftSuratPage to avoid SSR issues with react-pdf
const DraftSuratPage = dynamic(
  () => import('@/features/draft-surat').then(mod => ({ default: mod.DraftSuratPage })),
  { 
    ssr: false,
    loading: () => (
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }
);

export default function DraftSuratPageRoute() {
  const { user } = useAuth();
  // Get user role from auth context, fallback to 'staf' if not available
  const userRole = (user?.role?.toLowerCase() || 'staf') as 'admin-prodi' | 'staf' | 'supervisor';
  return <DraftSuratPage userRole={userRole} />;
}
