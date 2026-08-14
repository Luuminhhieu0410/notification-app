import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AppSettings } from '@/components/SettingPage/AppSettings/AppSettings';
import { SettingsHeader } from '@/components/SettingPage/Header/SettingsHeader';
import { NotificationSettings } from '@/components/SettingPage/NotificationSettings/NotificationSettings';
import { SettingSection } from '@/components/SettingPage/Section/SettingSection';
import { ThemeSettings } from '@/components/SettingPage/ThemeSettings/ThemeSettings';
import { BottomTabInset, BrandFonts, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getLocalUser } from '@/databases/repositories/user.repository';
import { supportsLocalDatabase } from '@/databases/initialize';
import { useQuery } from '@tanstack/react-query';

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const localUserQuery = useQuery({
    queryKey: ['local', 'user'],
    queryFn: getLocalUser,
    enabled: supportsLocalDatabase(),
  });
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <SettingsHeader />
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
            <NotificationSettings />
          </SettingSection>

          <SettingSection title="Giao diện">
            <ThemeSettings />
          </SettingSection>

          <SettingSection title="Ứng dụng">
            <AppSettings />
          </SettingSection>

          <Text style={[styles.version, { color: theme.textSecondary }]}>
            {localUserQuery.data?.backendUserId ?? null}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  content: { paddingHorizontal: 20, paddingTop: 28, gap: 24 },
  version: {
    textAlign: 'center',
    fontFamily: BrandFonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
});
