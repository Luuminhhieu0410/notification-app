import { StyleSheet, View } from 'react-native';

import AppRow from '@/components/SettingPage/AppRow/AppRow';
import { showShortToast } from '@/helpers/toast/showShortToast';
import { useTheme } from '@/hooks/use-theme';

export function AppSettings() {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <AppRow
        icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
        label="Chia sẻ ứng dụng"
        onPress={() => {
          // void Share.share({ message: 'Mỗi ngày một nụ cười cùng Nắng & Phím.' });
        }}
      />
      <AppRow
        divider
        icon={{ ios: 'star', android: 'star_rate', web: 'star_rate' }}
        label="Đánh giá ứng dụng"
        onPress={() =>
          showShortToast('Tính năng đánh giá sẽ có khi ứng dụng phát hành.')
        }
      />
      <AppRow
        divider
        icon={{ ios: 'info.circle', android: 'info', web: 'info' }}
        label="Về ứng dụng"
        onPress={() => {
          // TODO: Open the about screen.
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden' },
});
