import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { useTheme } from '@/hooks/use-theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandFonts } from '@/constants/theme';

export default function AppRow({
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
  appRow: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowPressed: { opacity: 0.62 },
  appRowLead: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  appIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowTitle: { fontFamily: BrandFonts.medium, fontSize: 15, lineHeight: 22 },
});
