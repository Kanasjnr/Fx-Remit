"use client";

import { useEffect } from "react";

export function FarcasterReady() {
  useEffect(() => {
    // Additional SDK ready call for Farcaster
    const checkAndCallReady = () => {
      const envObj: any = (window as any);
      
      if (envObj.farcaster?.actions?.ready) {
        console.log(" Calling sdk.actions.ready() from FarcasterReady component");
        envObj.farcaster.actions.ready().catch((error: any) => {
          console.warn('Failed to call sdk.actions.ready():', error);
        });
      } else {
        // Retry if SDK not ready yet
        setTimeout(checkAndCallReady, 200);
      }
    };

    // Check if we're in a Farcaster environment
    const url = new URL(window.location.href);
    const isFarcaster = url.searchParams.get("fcmini") === "1" || 
                       url.searchParams.get("miniapp") === "1" ||
                       document.referrer?.includes("warpcast.com") ||
                       document.referrer?.includes("farcaster");

    if (isFarcaster) {
      // Wait for app to load then call ready
      setTimeout(checkAndCallReady, 1000);
    }
  }, []);

  return null;
}
