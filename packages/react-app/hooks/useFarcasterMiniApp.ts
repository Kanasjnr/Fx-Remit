"use client";

import { useEffect, useMemo, useState } from "react";

export function useFarcasterMiniApp(): { isMiniApp: boolean } {
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMiniApp = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const isInMiniApp = await sdk.isInMiniApp();
        setIsMiniApp(isInMiniApp);
      } catch (error) {
        // Fallback detection
        const url = new URL(window.location.href);
        const qpFlag = url.searchParams.get("fcmini") === "1" || url.searchParams.get("miniapp") === "1";
        const referrerIsWarpcast = document.referrer?.includes("warpcast.com") || document.referrer?.includes("farcaster");
        const uaHasFarcaster = navigator.userAgent.toLowerCase().includes("farcaster") || navigator.userAgent.toLowerCase().includes("warpcast");
        
        const miniAppDetected = !!(qpFlag || referrerIsWarpcast || uaHasFarcaster);
        setIsMiniApp(miniAppDetected);
      }
    };

    checkMiniApp();
  }, []);

  return useMemo(() => ({ isMiniApp }), [isMiniApp]);
}


