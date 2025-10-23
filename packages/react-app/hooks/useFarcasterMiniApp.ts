"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

function detectMiniAppSync(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const url = new URL(window.location.href);
    const qpFlag = url.searchParams.get("fcmini") === "1" || url.searchParams.get("miniapp") === "1";
    const referrerIsWarpcast = document.referrer?.includes("warpcast.com") || document.referrer?.includes("farcaster");
    const uaHasFarcaster = navigator.userAgent.toLowerCase().includes("farcaster") || navigator.userAgent.toLowerCase().includes("warpcast");
    
    return !!(qpFlag || referrerIsWarpcast || uaHasFarcaster);
  } catch {
    return false;
  }
}

export function useFarcasterMiniApp(): { isMiniApp: boolean } {
  const [isMiniApp, setIsMiniApp] = useState(() => detectMiniAppSync());

  // Memoize the async detection function with increased timeout
  const checkMiniApp = useCallback(async () => {
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      // Increase timeout to 500ms for better reliability
      const isInMiniApp = await sdk.isInMiniApp();
      setIsMiniApp(isInMiniApp);
      console.log('🔍 Farcaster detection:', isInMiniApp ? 'Mini App' : 'Web');
    } catch (error) {
      console.log('🔍 Using fallback detection due to SDK error:', error);
      // Keep the fallback detection result
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    checkMiniApp();
  }, [checkMiniApp]);

  return useMemo(() => ({ isMiniApp }), [isMiniApp]);
}


