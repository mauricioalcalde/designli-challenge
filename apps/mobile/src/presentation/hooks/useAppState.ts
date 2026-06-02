import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Returns the current AppState status ('active', 'background', 'inactive')
 * and updates reactively when the app moves between foreground and background.
 */
export function useAppState(): AppStateStatus {
  const [status, setStatus] = useState<AppStateStatus>(AppState.currentState);
  const ref = useRef(status);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== ref.current) {
        ref.current = nextState;
        setStatus(nextState);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return status;
}
