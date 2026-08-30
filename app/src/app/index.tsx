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
import { useUser } from '@/context/UserContext';
import type { ApiResponse } from '@/helpers/api';
import { showShortToast } from '@/helpers/toast/showShortToast';
import { useNetwork } from '@/hooks/use-network';
import { useTheme } from '@/hooks/use-theme';
import {
  type DeliveryResponse,
  goToNextContent,
  goToPreviousContent,
  HOME_CONTENT_QUERY_KEY,
  loadHomeContent,
} from '@/services/home-content-service';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { isOnline, isResolved } = useNetwork();
  const { user, isLoading: isUserLoading } = useUser();
  const contentQuery = useQuery<DeliveryResponse>({
    queryKey: HOME_CONTENT_QUERY_KEY,
    queryFn: () => loadHomeContent(user!.id),
    enabled: Boolean(user) && isResolved && isOnline,
  });
  const currentContent = contentQuery.data;

  const updateCurrentContent = (content: DeliveryResponse) => {
    queryClient.setQueryData(HOME_CONTENT_QUERY_KEY, content);
  };

  const previousMutation = useMutation({
    mutationFn: () => {
      if (!currentContent) throw new Error('No current content');
      if (!user) throw new Error('No current user');
      return goToPreviousContent(user.id, currentContent.deliveryId);
    },
    onSuccess: updateCurrentContent,
    onError: () => showShortToast('Không thể tải câu trước. Thử lại nhé.'),
  });
  const nextMutation = useMutation({
    mutationFn: () => {
      if (!isOnline) throw new Error('Offline');
      if (!currentContent) throw new Error('No current content');
      if (!user) throw new Error('No current user');
      return goToNextContent(user.id, currentContent.deliveryId);
    },
    onSuccess: updateCurrentContent,
    onError: (error: unknown) => {
      if (!isOnline) {
        showShortToast('Bạn cần kết nối mạng để xem nội dung.');
        return;
      }
      const apiMessage = isAxiosError<ApiResponse<null>>(error)
        ? error.response?.data?.message
        : undefined;
      showShortToast(apiMessage ?? 'Không thể tải câu mới. Thử lại sau nhé.');
    },
  });

  const fallbackText =
    isUserLoading || !isResolved
      ? 'Loading...'
      : !isOnline
        ? 'Bạn cần kết nối mạng để xem nội dung.'
        : contentQuery.isError
          ? 'Không thể tải nội dung. Hãy thử lại.'
          : 'Loading...';
  const isNavigating =
    previousMutation.isPending ||
    nextMutation.isPending ||
    !currentContent ||
    !user ||
    !isOnline;
  const homePageContextValue = {
    compact: height < 720,
    contentId: currentContent?.deliveryId,
    quote: currentContent?.content.text ?? fallbackText,
    authorName: currentContent?.content.author?.name ?? null,
    hasPrevious: currentContent?.hasPrevious ?? false,
    isNavigating,
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
