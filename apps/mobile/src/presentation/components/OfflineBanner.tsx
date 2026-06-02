import { Banner } from './Banner';
import { useConnectivity } from '../hooks/useConnectivity';

interface OfflineBannerProps {
  testID?: string;
}

export function OfflineBanner({ testID }: OfflineBannerProps) {
  const isConnected = useConnectivity();

  if (isConnected) {
    return null;
  }

  return (
    <Banner
      message="You're offline. Showing cached data."
      variant="warning"
      testID={testID ?? 'offline-banner'}
    />
  );
}
