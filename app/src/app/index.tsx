import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { HomePageContext } from '@/context/HomePageContext';
import type { ApiResponse } from '@/helpers/api';
import { showShortToast } from '@/helpers/toast/showShortToast';
import { useNetwork } from '@/hooks/use-network';
import { useTheme } from '@/hooks/use-theme';
import {
  type CachedContent,
  getHomeHistoryState,
  goToNextContent,
  goToPreviousContent,
  HOME_CONTENT_QUERY_KEY,
  HOME_HISTORY_QUERY_KEY,
  loadHomeContent,
  OfflineNextError,
} from '@/services/home-content-service';

const FALLBACK_QUOTE = 'Có vẻ như Server đang sập!';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { isOnline, isResolved } = useNetwork();
  const contentQuery = useQuery<CachedContent | null>({
    queryKey: HOME_CONTENT_QUERY_KEY,
    queryFn: () => loadHomeContent(isOnline),
  });
  // const refetchContent = contentQuery.refetch;
  const currentContent = contentQuery.data;
  const historyQuery = useQuery({
    queryKey: [
      ...HOME_HISTORY_QUERY_KEY,
      currentContent?.deliveryId ?? 'empty',
    ],
    queryFn: getHomeHistoryState,
    enabled: Boolean(currentContent),
  });

  // useEffect(() => {
  //   if (isResolved && isOnline) void refetchContent();
  //   else
  //     showShortToast(
  //       'Máy đang ở trạng thái offline . Một vài tính năng có thể không hoạt động',
  //     );
  // }, [isOnline, isResolved, refetchContent]);

  const updateCurrentContent = (content: CachedContent | null) => {
    if (!content) return;
    queryClient.setQueryData(HOME_CONTENT_QUERY_KEY, content);
    void queryClient.invalidateQueries({ queryKey: HOME_HISTORY_QUERY_KEY });
  };

  const previousMutation = useMutation({
    mutationFn: goToPreviousContent,
    onSuccess: updateCurrentContent,
  });
  const nextMutation = useMutation({
    mutationFn: () => goToNextContent(isOnline),
    onSuccess: ({ content }) => updateCurrentContent(content),
    onError: (error: unknown) => {
      if (error instanceof OfflineNextError) {
        showShortToast(
          'Bạn đang ngoại tuyến. Kết nối mạng để xem câu mới nhé.',
        );
        return;
      }

      const apiMessage = isAxiosError<ApiResponse<null>>(error)
        ? error.response?.data?.message
        : undefined;
      showShortToast(apiMessage ?? 'Không thể tải câu mới. Thử lại sau nhé.');
    },
  });

  const homePageContextValue = {
    compact: height < 720,
    contentId: currentContent?.deliveryId,
    quote: currentContent?.text ?? FALLBACK_QUOTE,
    hasPrevious: historyQuery.data?.hasPrevious ?? false,
    isNavigating: previousMutation.isPending || nextMutation.isPending,
    isPreviousPending: previousMutation.isPending,
    isNextPending: nextMutation.isPending,
    goPrevious: previousMutation.mutate,
    goNext: nextMutation.mutate,
  };

  return (
    <HomePageContext.Provider value={homePageContextValue}>
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

          <HomeContent />

          <Text style={[styles.footer, { color: theme.textSecondary }]}>
            Một chút vui, bất cứ khi nào bạn cần.
          </Text>
        </SafeAreaView>
      </View>
    </HomePageContext.Provider>
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
