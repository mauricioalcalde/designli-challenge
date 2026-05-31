import NetInfo, {
  type NetInfoSubscription,
  type NetInfoState,
} from '@react-native-community/netinfo';

/**
 * Subscribe to network connectivity changes.
 * Returns the unsubscribe function (NetInfoSubscription).
 * Consumed by the `useConnectivity` hook in the presentation layer.
 */
export function subscribeToConnectivity(
  callback: (state: NetInfoState) => void,
): NetInfoSubscription {
  return NetInfo.addEventListener(callback);
}
