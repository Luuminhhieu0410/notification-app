import { useNetworkState } from 'expo-network';

export function useNetwork() {
  const state = useNetworkState();
  const isResolved = state.isConnected !== undefined;
  const isOnline =
    state.isConnected === true && state.isInternetReachable !== false;

  return { isOnline, isResolved };
}
