/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B1C1C',
    background: '#FCF9F8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F5DAD1',
    textSecondary: '#67504A',
    primary: '#9B442A',
    primarySoft: '#F5DAD1',
    primaryAction: '#E67E5F',
    outline: '#DCC1B9',
    divider: '#E8DAD6',
    control: '#EEE7E5',
  },
  dark: {
    text: '#FFF8F5',
    background: '#181312',
    backgroundElement: '#241D1B',
    backgroundSelected: '#593126',
    textSecondary: '#D8BDB5',
    primary: '#FFB59F',
    primarySoft: '#593126',
    primaryAction: '#FFB59F',
    outline: '#76564E',
    divider: '#493732',
    control: '#332724',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const BrandFonts = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semiBold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 50 }) ?? 0;
export const MaxContentWidth = 800;
