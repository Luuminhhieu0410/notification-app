import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function getGreeting(hour: number) {
  if (hour < 11) {
    return {
      content: 'Chào buổi sáng',
      icon: 'sunny-outline' as const,
      iconColor: '#F59E0B',
      textColor: '#B7791F',
    };
  }
  if (hour < 18) {
    return {
      content: 'Chào buổi chiều',
      icon: 'partly-sunny-outline' as const,
      iconColor: '#F97316',
      textColor: '#C2410C',
    };
  }
  return {
    content: 'Chào buổi tối',
    icon: 'moon-outline' as const,
    iconColor: '#6366F1',
    textColor: '#6366F1',
  };
}

export function HomeHeader() {
  const theme = useTheme();
  const today = useMemo(() => new Date(), []);
  const greeting = getGreeting(today.getHours());
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(today),
    [today],
  );

  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <View style={styles.greetingRow}>
          <Text style={[styles.greeting, { color: greeting.textColor }]}>
            {greeting.content}
          </Text>
          <Ionicons name={greeting.icon} size={18} color={greeting.iconColor} />
        </View>
        <Text style={[styles.date, { color: theme.text }]}>{dateLabel}</Text>
      </View>
      <Pressable
        accessibilityLabel="Mở cài đặt"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <SymbolView
          name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
          size={27}
          tintColor={theme.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerCopy: { gap: 6 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  greeting: { fontFamily: BrandFonts.medium, fontSize: 16, lineHeight: 23 },
  date: {
    fontFamily: BrandFonts.regular,
    fontSize: 19,
    lineHeight: 28,
    textTransform: 'capitalize',
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  pressed: { opacity: 0.62, transform: [{ scale: 0.97 }] },
});
