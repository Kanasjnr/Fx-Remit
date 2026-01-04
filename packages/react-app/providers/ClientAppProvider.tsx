'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

// Dynamically import AppProvider with SSR disabled to prevent
// indexedDB access during static generation
const AppProvider = dynamic(
  () => import('./AppProvider').then((mod) => mod.AppProvider),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  }
);

export function ClientAppProvider({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
