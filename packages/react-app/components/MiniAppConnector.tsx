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
    if (isMiniApp && !isConnected && connectors.length > 0 && !hasAttemptedConnect) {
      setHasAttemptedConnect(true);
      
      const connectWallet = () => {
        try {
          connect({ connector: connectors[0] });
        } catch (error) {
          setTimeout(connectWallet, 500);
        }
      };
      
      connectWallet();
    }
  }, [isMiniApp, isConnected, connectors, connect, hasAttemptedConnect]);

  useEffect(() => {
    if (!isConnected) {
      setHasAttemptedConnect(false);
    }
  }, [isConnected]);

  return null;
}
