'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { celo } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';
import { useFarcasterMiniApp } from '@/hooks/useFarcasterMiniApp';
import { MiniAppConnector } from '@/components/MiniAppConnector';
import { FarcasterReady } from '@/components/FarcasterReady';

import {
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  trustWallet,
} from '@rainbow-me/rainbowkit/wallets';

function useWagmiConfig() {
  const { isMiniApp } = useFarcasterMiniApp();

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
      appName: 'FX Remit - Global Money Transfers (Supports Valora via WalletConnect)',
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? '044601f65212332475a09bc14ceb3c34',
    }
  );

  const connectors = isMiniApp 
    ? [injected(), miniAppConnector()] 
    : webConnectors;

  return createConfig({
    connectors,
    chains: [celo],
    transports: { [celo.id]: http() },
  });
}

const queryClient = new QueryClient();

export function AppProvider({ children }: { children: React.ReactNode }) {
  const config = useWagmiConfig();
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <FarcasterReady />
          <MiniAppConnector />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
