import {
  getPermissionsAsync,
  PermissionStatus,
  requestPermissionsAsync,
} from 'expo-notifications';

export async function requestNotificationPermission(): Promise<boolean> {
  const permission = await getPermissionsAsync();

  if (permission.status === PermissionStatus.GRANTED) {
    return true;
  }

  if (!permission.canAskAgain) {
    return false;
  }

  const requestedPermission = await requestPermissionsAsync();

  return requestedPermission.status === PermissionStatus.GRANTED;
}
