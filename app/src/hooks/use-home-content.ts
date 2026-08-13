import { isAxiosError } from 'axios';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiResponse } from '@/helpers/api';
import { showShortToast } from '@/helpers/toast/showShortToast';
import { useNetwork } from '@/hooks/use-network';
import {
  getHomeHistoryState,
  goToNextContent,
  goToPreviousContent,
  HOME_CONTENT_QUERY_KEY,
  HOME_HISTORY_QUERY_KEY,
  loadHomeContent,
  type CachedContent,
} from '@/services/home-content';
import { OfflineNextError } from '@/services/home-content-service';

const FALLBACK_QUOTE =
  'Chúc mừng.\nBạn đã mở mắt thành công.\nChiếc chăn vẫn yêu bạn.\nNhưng công ty thì không.';

export function useHomeContent() {
  const queryClient = useQueryClient();
  const { isOnline, isResolved } = useNetwork();
  const contentQuery = useQuery<CachedContent | null>({
    queryKey: HOME_CONTENT_QUERY_KEY,
    queryFn: () => loadHomeContent(isOnline),
  });
  const refetchContent = contentQuery.refetch;
  const currentContent = contentQuery.data;
  const historyQuery = useQuery({
    queryKey: [
      ...HOME_HISTORY_QUERY_KEY,
      currentContent?.deliveryId ?? 'empty',
    ],
    queryFn: getHomeHistoryState,
    enabled: Boolean(currentContent),
  });

  useEffect(() => {
    if (isResolved && isOnline) void refetchContent();
  }, [isOnline, isResolved, refetchContent]);

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

  return {
    currentContent,
    quote: currentContent?.text ?? FALLBACK_QUOTE,
    hasPrevious: historyQuery.data?.hasPrevious ?? false,
    isNavigating: previousMutation.isPending || nextMutation.isPending,
    isPreviousPending: previousMutation.isPending,
    isNextPending: nextMutation.isPending,
    goPrevious: previousMutation.mutate,
    goNext: nextMutation.mutate,
  };
}
