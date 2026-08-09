import { useTheme } from '@/hooks/use-theme';
import { StyleSheet, Text, View } from 'react-native';
import { BrandFonts } from '@/constants/theme';

export function SettingSection({
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
const styles = StyleSheet.create({
  section: { gap: 9 },
  sectionTitle: {
    marginLeft: 8,
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
});
