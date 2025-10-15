"use client";

import { useEffect, useMemo, useState } from "react";

export function useFarcasterMiniApp(): { isMiniApp: boolean } {
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeFarcaster = async () => {
      try {
        // Dynamic import to ensure SDK is loaded
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        // Check if we're in a mini app
        const isInMiniApp = await sdk.isInMiniApp();
        setIsMiniApp(isInMiniApp);
        
        if (isInMiniApp) {
          console.log('🚀 Detected Farcaster Mini App environment');
          
          // Call ready immediately when detected
          try {
            await sdk.actions.ready();
            console.log('✅ Farcaster Mini App ready called successfully');
          } catch (readyError) {
            console.warn('⚠️ Failed to call sdk.actions.ready():', readyError);
            
            // Retry with delay
            setTimeout(async () => {
              try {
                await sdk.actions.ready();
                console.log('✅ Farcaster Mini App ready called successfully (retry)');
              } catch (retryError) {
                console.error('❌ Failed to call sdk.actions.ready() after retry:', retryError);
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.warn('⚠️ SDK import failed, using fallback detection:', error);
        
        // Fallback detection methods
        const url = new URL(window.location.href);
        const qpFlag = url.searchParams.get("fcmini") === "1" || url.searchParams.get("miniapp") === "1";
        const referrerIsWarpcast = document.referrer?.includes("warpcast.com") || document.referrer?.includes("farcaster");
        const uaHasFarcaster = navigator.userAgent.toLowerCase().includes("farcaster") || navigator.userAgent.toLowerCase().includes("warpcast");
        
        const miniAppDetected = !!(qpFlag || referrerIsWarpcast || uaHasFarcaster);
        setIsMiniApp(miniAppDetected);
        
        if (miniAppDetected) {
          console.log('🚀 Detected Farcaster environment (fallback)');
          
          // Try to call ready with fallback method
          const callReadyFallback = async () => {
            try {
              const { sdk } = await import('@farcaster/miniapp-sdk');
              await sdk.actions.ready();
              console.log('✅ Farcaster Mini App ready called successfully (fallback)');
            } catch (fallbackError) {
              console.error('❌ Failed to call sdk.actions.ready() (fallback):', fallbackError);
            }
          };
          
          // Try immediately and with delay
          callReadyFallback();
          setTimeout(callReadyFallback, 1000);
        }
      }
    };

    // Start initialization immediately
    initializeFarcaster();
  }, []);

  return useMemo(() => ({ isMiniApp }), [isMiniApp]);
}


