import {
  getPermissionsAsync,
  IosAuthorizationStatus,
  PermissionStatus,
  requestPermissionsAsync,
} from 'expo-notifications';
import { Platform } from 'react-native';

function isGranted(
  permission: Awaited<ReturnType<typeof getPermissionsAsync>>,
) {
  if (Platform.OS !== 'ios') {
    return permission.status === PermissionStatus.GRANTED;
  }
  return (
    permission.ios?.status === IosAuthorizationStatus.AUTHORIZED ||
    permission.ios?.status === IosAuthorizationStatus.PROVISIONAL ||
    permission.ios?.status === IosAuthorizationStatus.EPHEMERAL
  );
}

export async function requestNotificationPermission(): Promise<boolean> {
  const permission = await getPermissionsAsync();

  if (isGranted(permission)) return true;

  if (!permission.canAskAgain) {
    return false;
  }

  const requestedPermission = await requestPermissionsAsync();

  return isGranted(requestedPermission);
}
