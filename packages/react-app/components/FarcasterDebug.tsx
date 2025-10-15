"use client";

import { useEffect, useState } from "react";

export function FarcasterDebug() {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testManualReady = async () => {
    addDebugInfo("🧪 Manual ready test...");
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      await sdk.actions.ready();
      addDebugInfo("✅ Manual ready call succeeded!");
    } catch (error) {
      addDebugInfo(`❌ Manual ready failed: ${error}`);
    }
  };

  useEffect(() => {
    const testFarcasterSDK = async () => {
      addDebugInfo("🔍 Starting Farcaster SDK test...");
      
      try {
        // Test dynamic import
        addDebugInfo("📦 Importing SDK...");
        const { sdk } = await import('@farcaster/miniapp-sdk');
        addDebugInfo("✅ SDK imported successfully");
        
        // Test isInMiniApp
        addDebugInfo("🔍 Checking if in mini app...");
        const isInMiniApp = await sdk.isInMiniApp();
        addDebugInfo(`📱 isInMiniApp: ${isInMiniApp}`);
        
        if (isInMiniApp) {
          addDebugInfo("🚀 In mini app! Calling ready...");
          
          try {
            await sdk.actions.ready();
            addDebugInfo("✅ sdk.actions.ready() called successfully!");
          } catch (readyError) {
            addDebugInfo(`❌ Ready call failed: ${readyError}`);
            
            // Retry
            addDebugInfo("🔄 Retrying ready call in 1 second...");
            setTimeout(async () => {
              try {
                await sdk.actions.ready();
                addDebugInfo("✅ Ready call succeeded on retry!");
              } catch (retryError) {
                addDebugInfo(`❌ Retry failed: ${retryError}`);
              }
            }, 1000);
          }
        } else {
          addDebugInfo("🌐 Not in mini app environment");
          
          // Test fallback detection
          const url = new URL(window.location.href);
          const qpFlag = url.searchParams.get("fcmini") === "1" || url.searchParams.get("miniapp") === "1";
          const referrerIsWarpcast = document.referrer?.includes("warpcast.com") || document.referrer?.includes("farcaster");
          const uaHasFarcaster = navigator.userAgent.toLowerCase().includes("farcaster") || navigator.userAgent.toLowerCase().includes("warpcast");
          
          addDebugInfo(`🔍 Fallback detection: qpFlag=${qpFlag}, referrer=${referrerIsWarpcast}, ua=${uaHasFarcaster}`);
          
          if (qpFlag || referrerIsWarpcast || uaHasFarcaster) {
            addDebugInfo("🚀 Fallback detected mini app! Calling ready...");
            try {
              await sdk.actions.ready();
              addDebugInfo("✅ Ready called successfully (fallback)!");
            } catch (fallbackError) {
              addDebugInfo(`❌ Fallback ready failed: ${fallbackError}`);
            }
          }
        }
      } catch (error) {
        addDebugInfo(`❌ SDK test failed: ${error}`);
      }
    };

    testFarcasterSDK();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-md max-h-96 overflow-y-auto text-xs z-50">
      <div className="font-bold mb-2">🔧 Farcaster Debug</div>
      <button 
        onClick={testManualReady}
        className="mb-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
      >
        🧪 Test Ready Manually
      </button>
      <div className="space-y-1">
        {debugInfo.map((info, index) => (
          <div key={index} className="text-xs">{info}</div>
        ))}
      </div>
    </div>
  );
}
