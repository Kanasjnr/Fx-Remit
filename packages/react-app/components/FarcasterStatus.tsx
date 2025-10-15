"use client";

import { useFarcasterMiniApp } from '@/hooks/useFarcasterMiniApp';
import { useAccount } from 'wagmi';

export function FarcasterStatus() {
  const { isMiniApp } = useFarcasterMiniApp();
  const { isConnected, address } = useAccount();

  if (!isMiniApp) {
    return null; // Don't show anything if not in mini app
  }

  return (
    <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg text-sm z-50">
      <div className="font-semibold">🚀 Farcaster Mini App</div>
      <div className="text-xs mt-1">
        {isConnected ? (
          <>
            ✅ Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </>
        ) : (
          <>⏳ Connecting...</>
        )}
      </div>
    </div>
  );
}