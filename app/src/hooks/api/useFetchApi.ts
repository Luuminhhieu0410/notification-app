import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { api, type ApiResponse } from '@/helpers/api';

type ApiError = AxiosError<ApiResponse<null>>;

export interface UseFetchApiParams<T> {
  url: string;
  params?: Record<string, unknown>;
  defaultData?: T;
  enabled?: boolean;
  queryKey?: QueryKey;
  useAlert?: boolean;
  showError?: boolean;
  errorTitle?: string;
  errorMsg?: string;
  options?: Omit<
    UseQueryOptions<ApiResponse<T>, ApiError>,
    'queryKey' | 'queryFn'
  >;
}

export default function useFetchApi<T = unknown>({
  url,
  params = {},
  defaultData,
  enabled = true,
  queryKey,
  useAlert = false,
  showError = false,
  errorTitle = 'Có lỗi xảy ra',
  errorMsg = 'Không thể tải dữ liệu.',
  options = {},
}: UseFetchApiParams<T>) {
  const query = useQuery<ApiResponse<T>, ApiError>({
    queryKey: queryKey ?? [url, params],
    queryFn: () => api<T>({ url, method: 'GET', params }),
    enabled,
    ...options,
  });

  useEffect(() => {
    if (!useAlert || !showError || !query.error) return;

    Alert.alert(errorTitle, query.error.response?.data?.message ?? errorMsg);
  }, [errorMsg, errorTitle, query.error, showError, useAlert]);

  return {
    data: query.data?.data ?? defaultData,
    loading: query.isLoading,
    fetching: query.isFetching,
    fetched: query.isSuccess,
    isBackgroundRefetch: query.isRefetching,
    isFetched: query.isFetched,
    error: query.error,
    refetch: query.refetch,
  };
}
