import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Appearance,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { BottomTabInset, BrandFonts, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ThemePreference = 'system' | 'light' | 'dark';

let activeThemePreference: ThemePreference = 'system';

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Hệ thống', value: 'system' },
  { label: 'Sáng', value: 'light' },
  { label: 'Tối', value: 'dark' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState('07:00');
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    activeThemePreference,
  );

  function selectTheme(value: ThemePreference) {
    activeThemePreference = value;
    setThemePreference(value);
    Appearance.setColorScheme(value === 'system' ? 'unspecified' : value);
  }

  function cycleTime() {
    setNotificationTime((current) =>
      current === '07:00' ? '08:00' : current === '08:00' ? '09:00' : '07:00',
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={[styles.topBar, { borderBottomColor: theme.divider }]}>
          <Pressable
            accessibilityLabel="Quay lại trang chủ"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.replace('/')}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
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

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                (Platform.OS === 'web' ? 104 : BottomTabInset) +
                insets.bottom +
                24,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <SettingSection title="Thông báo">
            <View
              style={[
                styles.card,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <View
                style={[
                  styles.row,
                  styles.rowDivider,
                  { borderBottomColor: theme.divider },
                ]}
              >
                <View style={styles.rowCopy}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>
                    Thông báo mỗi ngày
                  </Text>
                  <Text
                    style={[
                      styles.rowDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Nhận một câu mới vào mỗi buổi sáng
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Thông báo mỗi ngày"
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: theme.control, true: theme.primary }}
                  thumbColor="#FFFFFF"
                  value={notificationsEnabled}
                />
              </View>
              <Pressable
                accessibilityLabel={`Đổi giờ thông báo, hiện tại ${notificationTime}`}
                accessibilityRole="button"
                disabled={!notificationsEnabled}
                onPress={cycleTime}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                  !notificationsEnabled && styles.disabled,
                ]}
              >
                <Text style={[styles.rowTitle, { color: theme.text }]}>
                  Thời gian
                </Text>
                <View
                  style={[
                    styles.timeChip,
                    { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <SymbolView
                    name={{
                      ios: 'clock',
                      android: 'schedule',
                      web: 'schedule',
                    }}
                    size={18}
                    tintColor={theme.primary}
                  />
                  <Text style={[styles.timeText, { color: theme.primary }]}>
                    {notificationTime}
                  </Text>
                </View>
              </Pressable>
            </View>
          </SettingSection>

          <SettingSection title="Giao diện">
            <View
              style={[
                styles.card,
                styles.themeCard,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <Text style={[styles.rowTitle, { color: theme.text }]}>
                Chế độ hiển thị
              </Text>
              <View
                style={[styles.segmented, { backgroundColor: theme.control }]}
              >
                {THEME_OPTIONS.map((option) => {
                  const selected = option.value === themePreference;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      key={option.value}
                      onPress={() => selectTheme(option.value)}
                      style={[
                        styles.segment,
                        selected && {
                          backgroundColor: theme.backgroundElement,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color: selected
                              ? theme.primary
                              : theme.textSecondary,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </SettingSection>

          <SettingSection title="Ứng dụng">
            <View
              style={[
                styles.card,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <AppRow
                icon={{
                  ios: 'square.and.arrow.up',
                  android: 'share',
                  web: 'share',
                }}
                label="Chia sẻ ứng dụng"
                onPress={() => {
                  void Share.share({
                    message: 'Mỗi ngày một nụ cười cùng Nắng & Phím.',
                  });
                }}
              />
              <AppRow
                divider
                icon={{ ios: 'star', android: 'star_rate', web: 'star_rate' }}
                label="Đánh giá ứng dụng"
                onPress={() =>
                  Alert.alert(
                    'Cảm ơn bạn!',
                    'Tính năng đánh giá sẽ khả dụng khi ứng dụng được phát hành.',
                  )
                }
              />
              <AppRow
                divider
                icon={{ ios: 'info.circle', android: 'info', web: 'info' }}
                label="Về ứng dụng"
                onPress={() =>
                  Alert.alert(
                    'Nắng & Phím',
                    'Một câu nói vui mỗi ngày, được viết cho người Việt.',
                  )
                }
              />
            </View>
          </SettingSection>

          <Text style={[styles.version, { color: theme.textSecondary }]}>
            Phiên bản 1.0.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SettingSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function AppRow({
  divider,
  icon,
  label,
  onPress,
}: {
  divider?: boolean;
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.appRow,
        divider && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.divider,
        },
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.appRowLead}>
        <View style={[styles.appIcon, { backgroundColor: theme.primarySoft }]}>
          <SymbolView name={icon} size={21} tintColor={theme.primary} />
        </View>
        <Text style={[styles.rowTitle, { color: theme.text }]}>{label}</Text>
      </View>
      <SymbolView
        name={{
          ios: 'chevron.right',
          android: 'chevron_right',
          web: 'chevron_right',
        }}
        size={18}
        tintColor={theme.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
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
  content: { paddingHorizontal: 20, paddingTop: 28, gap: 24 },
  section: { gap: 9 },
  sectionTitle: {
    marginLeft: 8,
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  card: { borderRadius: 16, overflow: 'hidden' },
  row: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: BrandFonts.medium, fontSize: 15, lineHeight: 22 },
  rowDescription: {
    fontFamily: BrandFonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  timeChip: {
    minWidth: 94,
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  timeText: { fontFamily: BrandFonts.semiBold, fontSize: 15 },
  themeCard: { padding: 16, gap: 14 },
  segmented: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentText: { fontFamily: BrandFonts.medium, fontSize: 13 },
  appRow: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appRowLead: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  appIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: {
    textAlign: 'center',
    fontFamily: BrandFonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  rowPressed: { opacity: 0.62 },
  pressed: { opacity: 0.62, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.42 },
});
