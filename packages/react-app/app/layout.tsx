import '@/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';

import { AppProvider } from '@/providers/AppProvider';
import { ToastContainer } from 'react-toastify';
import type { Metadata } from 'next';
import { FarcasterReady } from '@/components/FarcasterReady';

export const metadata: Metadata = {
  title: 'FX Remit - Global Money Transfers',
  description: 'Send money globally with ultra-low 1.5% fees, lightning-fast settlements, and enterprise-grade security. Powered by Celo blockchain.',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.jpg" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <meta name="theme-color" content="#2563eb" />
        <meta property="fc:miniapp" content="https://fx-remit.xyz" />
        <link rel="preload" href="/fx-remit.svg" as="image" />
        <link rel="preload" href="/blur and glass.svg" as="image" />
      </head>
      <body>
        <FarcasterReady />
        <AppProvider>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </AppProvider>
      </body>
    </html>
  );
}
