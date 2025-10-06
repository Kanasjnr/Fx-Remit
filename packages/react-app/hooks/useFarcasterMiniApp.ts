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

    setIsMiniApp(!!(qpFlag || referrerIsWarpcast || uaHasFarcaster || hasFarcasterSDK));
  }, []);

  return useMemo(() => ({ isMiniApp }), [isMiniApp]);
}


