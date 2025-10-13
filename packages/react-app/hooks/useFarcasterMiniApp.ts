"use client";

import { useEffect, useMemo, useState } from "react";

export function useFarcasterMiniApp(): { isMiniApp: boolean } {
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const qpFlag = url.searchParams.get("fcmini") === "1" || url.searchParams.get("miniapp") === "1";
    const referrerIsWarpcast = document.referrer?.includes("warpcast.com") || document.referrer?.includes("farcaster");
    const uaHasFarcaster = navigator.userAgent.toLowerCase().includes("farcaster") || navigator.userAgent.toLowerCase().includes("warpcast");
    const envObj: any = (window as any);
    const hasFarcasterSDK = !!envObj.farcaster || !!envObj.__FARCASTER__;

    const miniAppDetected = !!(qpFlag || referrerIsWarpcast || uaHasFarcaster || hasFarcasterSDK);
    setIsMiniApp(miniAppDetected);

    // Call sdk.actions.ready() after a small delay to ensure app is loaded
    if (miniAppDetected) {
      let retryCount = 0;
      const maxRetries = 10;
      
      const callReady = () => {
        if (envObj.farcaster?.actions?.ready) {
          envObj.farcaster.actions.ready().catch((error: any) => {
            // Silent error handling - no console spam
          });
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(callReady, 100);
        }
      };
      
      // Wait a bit for the app to fully load
      setTimeout(callReady, 500);
    }
  }, []);

  return useMemo(() => ({ isMiniApp }), [isMiniApp]);
}


