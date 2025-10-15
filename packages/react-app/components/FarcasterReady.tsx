"use client";

import { useEffect } from "react";
import { sdk } from '@farcaster/miniapp-sdk';

export function FarcasterReady() {
  useEffect(() => {
    // After your app is fully loaded and ready to display
    const callReady = async () => {
      try {
        await sdk.actions.ready();
      } catch (error) {
        // Silent error handling
      }
    };

    callReady();
  }, []);

  return null;
}
