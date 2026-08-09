import { SymbolView } from 'expo-symbols';
import {
  TabList,
  TabSlot,
  Tabs,
  TabTrigger,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <View pointerEvents="box-none" style={styles.shell}>
          <View
            style={[
              styles.tabBar,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <TabTrigger name="home" href="/" asChild>
              <TabButton icon="format_quote">Trang chủ</TabButton>
            </TabTrigger>
            <TabTrigger name="settings" href="/settings" asChild>
              <TabButton icon="settings">Cài đặt</TabButton>
            </TabTrigger>
          </View>
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  children,
  isFocused,
  icon,
  ...props
}: TabTriggerSlotProps & { icon: 'format_quote' | 'settings' }) {
  const theme = useTheme();
  const symbolName =
    icon === 'settings'
      ? {
          ios: 'gearshape' as const,
          android: 'settings' as const,
          web: 'settings' as const,
        }
      : {
          ios: 'quote.bubble' as const,
          android: 'format_quote' as const,
          web: 'format_quote' as const,
        };
  return (
    <Pressable
      {...props}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.tab,
          isFocused && { backgroundColor: theme.primarySoft },
        ]}
      >
        <SymbolView
          name={symbolName}
          size={23}
          tintColor={isFocused ? theme.primary : theme.textSecondary}
        />
        <Text
          style={[
            styles.label,
            { color: isFocused ? theme.primary : theme.textSecondary },
          ]}
        >
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  tabBar: {
    width: '100%',
    maxWidth: 680,
    minHeight: 76,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 8,
    shadowColor: '#2D2D2D',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  pressable: { flex: 1, maxWidth: 220 },
  tab: {
    minHeight: 58,
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
  },
  label: { fontFamily: BrandFonts.medium, fontSize: 14 },
  pressed: { opacity: 0.64 },
});
