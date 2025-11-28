import { useEffect } from 'react';

const REFRESH_EVENT = 'fxremit:refresh-data';

export function triggerDataRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
  }
}

export function useRefreshTrigger(refetch: () => void | Promise<void>) {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const handleRefresh = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        refetch();
        timeoutId = null;
      }, 500);
    };

    window.addEventListener(REFRESH_EVENT, handleRefresh);

    return () => {
      window.removeEventListener(REFRESH_EVENT, handleRefresh);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [refetch]);
}

