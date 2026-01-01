'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Dynamically import AppProvider with SSR disabled to prevent
// indexedDB access during static generation
const AppProvider = dynamic(
  () => import('./AppProvider').then((mod) => mod.AppProvider),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    ),
  }
);

export function ClientAppProvider({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
