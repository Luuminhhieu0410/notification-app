import { Platform, ToastAndroid } from 'react-native';

export function showShortToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  console.info(message);
}
