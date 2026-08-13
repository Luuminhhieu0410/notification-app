import {
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { HomeContent } from '@/components/HomePage/HomeContent';
import { HomeHeader } from '@/components/HomePage/HomeHeader';
import { BottomTabInset, BrandFonts, MaxContentWidth } from '@/constants/theme';
import { useHomeContent } from '@/hooks/use-home-content';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const homeContent = useHomeContent();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
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
        <HomeHeader />
        <HomeContent
          compact={height < 720}
          contentId={homeContent.currentContent?.deliveryId}
          quote={homeContent.quote}
          hasPrevious={homeContent.hasPrevious}
          isNavigating={homeContent.isNavigating}
          isPreviousPending={homeContent.isPreviousPending}
          isNextPending={homeContent.isNextPending}
          onPrevious={homeContent.goPrevious}
          onNext={homeContent.goNext}
        />
        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          Một chút vui, bất cứ khi nào bạn cần.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', paddingHorizontal: 24, paddingTop: 18 },
  footer: {
    textAlign: 'center',
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
});
