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

    // Call sdk.actions.ready() if we're in a Mini App to hide splash screen
    if (miniAppDetected && envObj.farcaster?.actions) {
      envObj.farcaster.actions.ready().catch((error: any) => {
        console.warn('Failed to call sdk.actions.ready():', error);
      });
    }
  }, []);

  return useMemo(() => ({ isMiniApp }), [isMiniApp]);
}


