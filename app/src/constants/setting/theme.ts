export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Hệ thống', value: 'system' },
  { label: 'Sáng', value: 'light' },
  { label: 'Tối', value: 'dark' },
];
