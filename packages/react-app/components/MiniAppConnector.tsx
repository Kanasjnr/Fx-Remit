"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useConnect, useAccount } from "wagmi";
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp";

export function MiniAppConnector() {
  const { isMiniApp } = useFarcasterMiniApp();
  const { connectors, connect } = useConnect();
  const { isConnected } = useAccount();
  const [hasAttemptedConnect, setHasAttemptedConnect] = useState(false);

  // Memoize the connect wallet function to prevent recreation
  const connectWallet = useCallback(() => {
    try {
      // Find the Farcaster Mini App connector (it should be the only one in Mini App mode)
      const farcasterConnector = connectors.find(connector => 
        connector.id === 'farcaster_miniapp' || 
        connector.name?.toLowerCase().includes('farcaster')
      );
      
      // Use the Farcaster connector if found, otherwise use the first connector
      const connectorToUse = farcasterConnector || connectors[0];
      
      if (connectorToUse) {
        connect({ connector: connectorToUse });
      }
    } catch (error) {
      console.error('Failed to connect to Farcaster wallet:', error);
      setTimeout(connectWallet, 500);
    }
  }, [connect, connectors]);

  const shouldConnect = useMemo(() => {
    return isMiniApp && !isConnected && connectors.length > 0 && !hasAttemptedConnect;
  }, [isMiniApp, isConnected, connectors.length, hasAttemptedConnect]);

  useEffect(() => {
    if (shouldConnect) {
      setHasAttemptedConnect(true);
      connectWallet();
    }
  }, [shouldConnect, connectWallet]);

  useEffect(() => {
    if (!isConnected) {
      setHasAttemptedConnect(false);
    }
  }, [isConnected]);

  return null;
}
