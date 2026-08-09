import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { BottomTabInset, BrandFonts, MaxContentWidth } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';

const QUOTE =
  'Chúc mừng.\nBạn đã mở mắt thành công.\nChiếc chăn vẫn yêu bạn.\nNhưng công ty thì không.';

function getGreeting(hour: number) {
  if (hour < 11)
    return {
      content: 'Chào buổi sáng',
      icon: <Ionicons name="sunny-outline" size={18} color="#F59E0B" />,
      textColor: '#B7791F',
    };
  if (hour < 18)
    return {
      content: 'chào buổi chiều',
      icon: (
        <View style={{ transform: [{ translateY: 2 }] }}>
          <Ionicons name="partly-sunny-outline" size={18} color="#F97316" />
        </View>
      ),
      textColor: '#C2410C',
    };
  return {
    content: 'Chào buổi tối',
    icon: <Ionicons name="moon-outline" size={18} color="#6366F1" />,
    textColor: '#6366F1',
  };
}

export default function HomeScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [liked, setLiked] = useState(false);
  const compact = height < 720;

  const today = useMemo(() => new Date(), []);
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(today),
    [today],
  );

  async function shareQuote() {
    await Share.share({ message: `${QUOTE}\n\n— Nắng & Phím` });
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor:
            colorScheme === 'dark' ? theme.background : '#FDF8F1',
        },
      ]}
    >
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[
          styles.safeArea,
          {
            paddingBottom:
              Platform.OS === 'web' ? 104 + insets.bottom : BottomTabInset,
            maxWidth: Math.min(width, MaxContentWidth),
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text
              style={[
                styles.greeting,
                { color: getGreeting(today.getHours()).textColor },
              ]}
            >
              {getGreeting(today.getHours()).content}{' '}
              <Text style={styles.sun}>
                {getGreeting(today.getHours()).icon}
              </Text>
            </Text>
            <Text style={[styles.date, { color: theme.text }]}>
              {dateLabel}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Mở cài đặt"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
              size={28}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        </View>

        <View style={[styles.quoteArea, compact && styles.quoteAreaCompact]}>
          <Text
            accessibilityRole="text"
            style={[
              styles.quote,
              compact && styles.quoteCompact,
              { color: theme.text },
            ]}
          >
            Chúc mừng.{`\n`}Bạn đã mở mắt thành công.{`\n`}Chiếc chăn vẫn yêu
            bạn .{`\n`}
            Nhưng công ty thì không.
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={
                liked ? 'Bỏ yêu thích câu nói' : 'Yêu thích câu nói'
              }
              accessibilityRole="button"
              accessibilityState={{ selected: liked }}
              onPress={() => setLiked((value) => !value)}
              style={({ pressed }) => [
                styles.action,
                {
                  borderColor: theme.outline,
                  backgroundColor: liked ? theme.primarySoft : 'transparent',
                },
                pressed && styles.pressed,
              ]}
            >
              <SymbolView
                name={{
                  ios: liked ? 'heart.fill' : 'heart',
                  android: liked ? 'favorite' : 'favorite_border',
                  web: 'favorite',
                }}
                size={25}
                tintColor={theme.primaryAction}
              />
            </Pressable>
            <Pressable
              accessibilityLabel="Chia sẻ câu nói"
              accessibilityRole="button"
              onPress={() => void shareQuote()}
              style={({ pressed }) => [
                styles.action,
                { borderColor: theme.outline },
                pressed && styles.pressed,
              ]}
            >
              <SymbolView
                name={{
                  ios: 'square.and.arrow.up',
                  android: 'share',
                  web: 'share',
                }}
                size={24}
                tintColor={theme.primaryAction}
              />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          Mỗi ngày một câu. Mai quay lại nhé.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', paddingHorizontal: 24, paddingTop: 18 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerCopy: { gap: 7 },
  greeting: { fontFamily: BrandFonts.medium, fontSize: 16, lineHeight: 23 },
  sun: { fontSize: 20 },
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
  sunDoodle: {
    position: 'absolute',
    top: 99,
    left: 8,
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
    transform: [{ rotate: '-12deg' }],
  },
  quoteArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
    gap: 54,
  },
  quoteAreaCompact: { gap: 30 },
  quote: {
    maxWidth: 510,
    textAlign: 'center',
    fontFamily: BrandFonts.bold,
    fontSize: 18,
    lineHeight: 45,
    letterSpacing: -0.6,
  },
  quoteCompact: { fontSize: 26, lineHeight: 37 },
  emphasis: { textDecorationLine: 'underline', textDecorationStyle: 'solid' },
  actions: { flexDirection: 'row', gap: 28 },
  action: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.62, transform: [{ scale: 0.98 }] },
  footer: {
    textAlign: 'center',
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
});
