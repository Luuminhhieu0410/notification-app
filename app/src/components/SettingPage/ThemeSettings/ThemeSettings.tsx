import { useEffect, useState } from 'react';
import { Appearance, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts } from '@/constants/theme';
import { THEME_OPTIONS, type ThemePreference } from '@/constants/setting/theme';
import { supportsLocalDatabase } from '@/databases/initialize';
import {
  getLocalSetting,
  updateThemePreference,
} from '@/databases/repositories/setting.repository';
import { useTheme } from '@/hooks/use-theme';

export function ThemeSettings() {
  const theme = useTheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => {
    if (!supportsLocalDatabase()) return;
    void getLocalSetting().then((setting) => {
      setPreference(setting.themePreference);
    });
  }, []);

  function selectTheme(value: ThemePreference) {
    setPreference(value);
    Appearance.setColorScheme(value === 'system' ? 'unspecified' : value);
    if (supportsLocalDatabase()) void updateThemePreference(value);
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <Text style={[styles.title, { color: theme.text }]}>Chế độ hiển thị</Text>
      <View style={[styles.segmented, { backgroundColor: theme.control }]}>
        {THEME_OPTIONS.map((option) => {
          const selected = option.value === preference;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={option.value}
              onPress={() => selectTheme(option.value)}
              style={[
                styles.segment,
                selected && { backgroundColor: theme.backgroundElement },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: selected ? theme.primary : theme.textSecondary,
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
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', padding: 16, gap: 14 },
  title: { fontFamily: BrandFonts.medium, fontSize: 15, lineHeight: 22 },
  segmented: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentText: { fontFamily: BrandFonts.medium, fontSize: 13 },
});
