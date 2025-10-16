"use client";

import { useEffect } from "react";

export function FarcasterReady() {
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        const isInMiniApp = await sdk.isInMiniApp(); 
        console.log('Is in mini app:', isInMiniApp);
        
        if (isInMiniApp) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await sdk.actions.ready();
          console.log(' Farcaster SDK ready() called successfully');
        } else {
          console.log('Not in Farcaster mini app context, skipping ready() call');
        }
      } catch (error) {
        console.log('Farcaster SDK error:', error instanceof Error ? error.message : String(error));
      }
    };

    const timeoutId = setTimeout(initializeFarcaster, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}
