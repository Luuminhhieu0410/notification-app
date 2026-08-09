import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Appearance,
  Platform,
  Pressable,
  ScrollView,
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
import AppRow from '@/components/SettingPage/AppRow/AppRow';
import { THEME_OPTIONS, ThemePreference } from '@/constants/setting/theme';
import { NOTIFICATION_HOURS, NotificationHour } from '@/constants/setting/hour';
import { SettingSection } from '@/components/SettingPage/Section/SettingSection';

export default function SettingsScreen() {
  let activeThemePreference: ThemePreference = 'system';
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationHour, setNotificationHour] = useState<NotificationHour>(7);
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    activeThemePreference,
  );

  function selectTheme(value: ThemePreference) {
    activeThemePreference = value;
    setThemePreference(value);
    Appearance.setColorScheme(value === 'system' ? 'unspecified' : value);
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
              <View
                accessibilityLabel={`Giờ thông báo, hiện tại ${notificationHour} giờ`}
                style={[
                  styles.row,
                  styles.timeRow,
                  !notificationsEnabled && styles.disabled,
                ]}
              >
                <Text style={[styles.rowTitle, { color: theme.text }]}>
                  Thời gian
                </Text>
                <View style={styles.timeOptions}>
                  {NOTIFICATION_HOURS.map((hour) => {
                    const selected = hour === notificationHour;
                    return (
                      <Pressable
                        accessibilityLabel={`${hour} giờ sáng`}
                        accessibilityRole="radio"
                        accessibilityState={{
                          checked: selected,
                          disabled: !notificationsEnabled,
                        }}
                        disabled={!notificationsEnabled}
                        key={hour}
                        onPress={() => setNotificationHour(hour)}
                        style={({ pressed }) => [
                          styles.timeOption,
                          { backgroundColor: theme.control },
                          selected && { backgroundColor: theme.primary },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            {
                              color: selected
                                ? theme.backgroundElement
                                : theme.textSecondary,
                            },
                          ]}
                        >
                          {hour} giờ
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
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
                  // void Share.share({
                  //   message: 'Mỗi ngày một nụ cười cùng Nắng & Phím.',
                  // });
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
                onPress={() => {
                  // Alert.alert(
                  //   'Một câu nói vui mỗi ngày, được viết cho người Việt.',
                  // );
                }}
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
  timeRow: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: 12,
  },
  timeOptions: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  timeOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOptionText: {
    fontFamily: BrandFonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
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

  version: {
    textAlign: 'center',
    fontFamily: BrandFonts.regular,
    fontSize: 12,
    marginTop: 2,
  },

  pressed: { opacity: 0.62, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.42 },
});
