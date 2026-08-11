import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SettingsHeader() {
  const theme = useTheme();

  return (
    <View style={[styles.topBar, { borderBottomColor: theme.divider }]}>
      <Pressable
        accessibilityLabel="Quay lại trang chủ"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.replace('/')}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <SymbolView
          name={{
            ios: 'arrow.left',
            android: 'arrow_back',
            web: 'arrow_back',
          }}
          size={23}
          tintColor={theme.primary}
        />
      </Pressable>
      <Text style={[styles.title, { color: theme.text }]}>Cài đặt</Text>
      <View style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  title: { fontFamily: BrandFonts.semiBold, fontSize: 19, lineHeight: 28 },
  pressed: { opacity: 0.62, transform: [{ scale: 0.98 }] },
});
