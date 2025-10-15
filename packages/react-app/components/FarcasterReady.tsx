"use client";

import { useEffect } from "react";

export function FarcasterReady() {
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // Dynamic import to ensure SDK is loaded
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        // Check if we're in a mini app
        const isInMiniApp = await sdk.isInMiniApp();
        
        if (isInMiniApp) {
          console.log('🚀 FarcasterReady: Detected Mini App environment');
          
          // Call ready immediately
          try {
            await sdk.actions.ready();
            console.log('✅ FarcasterReady: ready called successfully');
          } catch (readyError) {
            console.warn('⚠️ FarcasterReady: Failed to call ready:', readyError);
            
            // Retry with delay
            setTimeout(async () => {
              try {
                await sdk.actions.ready();
                console.log('✅ FarcasterReady: ready called successfully (retry)');
              } catch (retryError) {
                console.error('❌ FarcasterReady: Failed after retry:', retryError);
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.warn('⚠️ FarcasterReady: SDK import failed, using fallback:', error);
        
        // Fallback detection
        const url = new URL(window.location.href);
        const isFarcaster = url.searchParams.get("fcmini") === "1" || 
                           url.searchParams.get("miniapp") === "1" ||
                           document.referrer?.includes("warpcast.com") ||
                           document.referrer?.includes("farcaster");

        if (isFarcaster) {
          console.log('🚀 FarcasterReady: Detected environment (fallback)');
          
          const callReadyFallback = async () => {
            try {
              const { sdk } = await import('@farcaster/miniapp-sdk');
              await sdk.actions.ready();
              console.log('✅ FarcasterReady: ready called successfully (fallback)');
            } catch (fallbackError) {
              console.error('❌ FarcasterReady: Failed (fallback):', fallbackError);
            }
          };
          
          // Try immediately and with delay
          callReadyFallback();
          setTimeout(callReadyFallback, 1000);
        }
      }
    };

    // Start immediately
    initializeFarcaster();
  }, []);

  return null;
}
