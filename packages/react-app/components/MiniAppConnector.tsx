"use client";

import { useEffect, useState } from "react";
import { useConnect, useAccount } from "wagmi";
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp";

export function MiniAppConnector() {
  const { isMiniApp } = useFarcasterMiniApp();
  const { connectors, connect } = useConnect();
  const { isConnected } = useAccount();
  const [hasAttemptedConnect, setHasAttemptedConnect] = useState(false);

  useEffect(() => {
    // Auto-connect in Mini App mode if not already connected
    if (isMiniApp && !isConnected && connectors.length > 0 && !hasAttemptedConnect) {
      setHasAttemptedConnect(true);
      
      // Small delay to ensure connectors are ready
      const connectWallet = () => {
        try {
          connect({ connector: connectors[0] });
        } catch (error) {
          // Silent retry - no console spam
          setTimeout(connectWallet, 1000);
        }
      };
      
      setTimeout(connectWallet, 100);
    }
  }, [isMiniApp, isConnected, connectors, connect, hasAttemptedConnect]);

  // Reset attempt flag when disconnected
  useEffect(() => {
    if (!isConnected) {
      setHasAttemptedConnect(false);
    }
  }, [isConnected]);

  // This component doesn't render anything - it just handles auto-connection
  return null;
}
