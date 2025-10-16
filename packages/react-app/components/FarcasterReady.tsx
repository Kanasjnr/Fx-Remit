"use client";

import { useEffect } from "react";

export function FarcasterReady() {
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        await sdk.actions.ready();
       
        
        const isInMiniApp = await sdk.isInMiniApp(); 
      } catch (error) {
        console.log(' Farcaster SDK:', error instanceof Error ? error.message : String(error));
      }
    };

    initializeFarcaster();
  }, []);

  return null;
}
