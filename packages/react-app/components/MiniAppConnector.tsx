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
      connect({ connector: connectors[0] });
    } catch (error) {
      setTimeout(connectWallet, 500);
    }
  }, [connect, connectors]);

  // Memoize the connection condition to prevent unnecessary effect runs
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
