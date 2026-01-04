'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig, http, createStorage } from 'wagmi';
import { celo } from 'wagmi/chains';
import { useFarcasterMiniApp } from '@/hooks/useFarcasterMiniApp';
import { MiniAppConnector } from '@/components/MiniAppConnector';
import { TransactionStatusProvider } from './TransactionStatusProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useState, useEffect } from 'react';

// SSR-safe storage that only uses localStorage on the client
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// Create storage only on client side
const getStorage = () => {
  if (typeof window === 'undefined') {
    return createStorage({ storage: noopStorage });
  }
  return createStorage({ storage: localStorage });
};

let desktopConfigInstance: ReturnType<typeof createConfig> | null = null;
let miniAppConfigInstance: ReturnType<typeof createConfig> | null = null;

async function getDesktopConfig() {
  // Guard against SSR
  if (typeof window === 'undefined') {
    return null;
  }

  if (!desktopConfigInstance) {
    const {
      injectedWallet,
      metaMaskWallet,
      walletConnectWallet,
      coinbaseWallet,
      trustWallet,
    } = await import('@rainbow-me/rainbowkit/wallets');

    const webConnectors = connectorsForWallets(
      [
        {
          groupName: 'Recommended for Celo',
          wallets: [walletConnectWallet, metaMaskWallet],
        },
        {
          groupName: 'Popular Wallets',
          wallets: [coinbaseWallet, trustWallet, injectedWallet],
        },
      ],
      {
        appName: 'FX Remit - Global Money Transfers ',
        projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? '044601f65212332475a09bc14ceb3c34',
      }
    );

    desktopConfigInstance = createConfig({
      connectors: webConnectors,
      chains: [celo],
      transports: { [celo.id]: http('https://forno.celo.org') },
      storage: getStorage(),
      ssr: true,
    });
  }
  return desktopConfigInstance;
}

async function getMiniAppConfig() {
  // Guard against SSR
  if (typeof window === 'undefined') {
    return null;
  }

  if (!miniAppConfigInstance) {
    const { farcasterMiniApp } = await import('@farcaster/miniapp-wagmi-connector');
    miniAppConfigInstance = createConfig({
      connectors: [farcasterMiniApp()],
      chains: [celo],
      transports: { [celo.id]: http('https://forno.celo.org') },
      storage: getStorage(),
      ssr: true,
    });
  }
  return miniAppConfigInstance;
}

function useWagmiConfig() {
  const { isMiniApp } = useFarcasterMiniApp();
  const [config, setConfig] = useState<ReturnType<typeof createConfig> | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (isMiniApp) {
      getMiniAppConfig().then(setConfig);
    } else {
      getDesktopConfig().then(setConfig);
    }
  }, [isMiniApp, isClient]);

  return config;
}

const queryClient = new QueryClient();

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isMiniApp } = useFarcasterMiniApp();
  const config = useWagmiConfig();

  if (!config) {
    return <LoadingSpinner />;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {isMiniApp ? (

          <TransactionStatusProvider>
            <MiniAppConnector />
            {children}
          </TransactionStatusProvider>
        ) : (

          <RainbowKitProvider>
            <TransactionStatusProvider>
              {children}
            </TransactionStatusProvider>
          </RainbowKitProvider>
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
