"use client";

import { useEffect } from "react";

export function FarcasterReady() {
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        await sdk.actions.ready();
        console.log(' Farcaster SDK ready() called successfully');
      } catch (error) {
        console.log('Farcaster SDK not available or not in mini app context:', error instanceof Error ? error.message : String(error));
      }
    };

    initializeFarcaster();
  }, []);

  return null;
}
