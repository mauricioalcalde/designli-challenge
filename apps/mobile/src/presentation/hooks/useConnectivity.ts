import { useEffect, useState } from 'react';
import { subscribeToConnectivity } from '../../data/connectivity';

/**
 * React hook that re-renders when network connectivity changes.
 * Returns `true` when connected, `false` when offline.
 */
export function useConnectivity(): boolean {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToConnectivity((state) => {
      setIsConnected(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  return isConnected;
}
