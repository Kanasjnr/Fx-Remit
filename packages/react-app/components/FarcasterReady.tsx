"use client";

import { useEffect } from "react";
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp";

export function FarcasterReady() {
  const { isMiniApp } = useFarcasterMiniApp();

  useEffect(() => {
    // Only call ready() when we're actually in a mini app context
    if (!isMiniApp) return;

    const callReady = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        await sdk.actions.ready();
        console.log('Farcaster SDK ready() called successfully');
      } catch (error) {
        console.error('Failed to call Farcaster SDK ready():', error);
      }
    };

    callReady();
  }, [isMiniApp]);

  return null;
}
