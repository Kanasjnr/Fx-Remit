"use client";

import { useEffect } from "react";
import { useConnect, useAccount } from "wagmi";
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp";

export function MiniAppConnector() {
  const { isMiniApp } = useFarcasterMiniApp();
  const { connectors, connect } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    // Auto-connect in Mini App mode if not already connected
    if (isMiniApp && !isConnected && connectors.length > 0) {
      console.log(" Auto-connecting wallet in Mini App mode...");
      
      // Small delay to ensure connectors are ready
      const connectWallet = () => {
        try {
          connect({ connector: connectors[0] });
        } catch (error) {
          console.warn("Auto-connect failed, retrying...", error);
          setTimeout(connectWallet, 1000);
        }
      };
      
      setTimeout(connectWallet, 100);
    }
  }, [isMiniApp, isConnected, connectors, connect]);

  // This component doesn't render anything - it just handles auto-connection
  return null;
}
