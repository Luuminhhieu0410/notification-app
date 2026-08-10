import {
  type QueryKey,
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { Alert } from 'react-native';

import { api, type ApiResponse } from '@/helpers/api';

type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ApiError = AxiosError<ApiResponse<null>>;

export interface EditVariables<TBody> {
  data: TBody;
  invalidateKey?: QueryKey;
  successMsg?: string;
  errorMsg?: string;
}

export interface UseEditApiParams<TData, TBody> {
  url: string;
  method?: HttpMethod;
  useAlert?: boolean;
  showError?: boolean;
  successTitle?: string;
  errorTitle?: string;
  successMsg?: string;
  errorMsg?: string;
  options?: Omit<
    UseMutationOptions<ApiResponse<TData>, ApiError, EditVariables<TBody>>,
    'mutationFn'
  >;
}

export default function useEditApi<TData = unknown, TBody = unknown>({
  url,
  method = 'POST',
  useAlert = true,
  showError = true,
  successTitle = 'Thành công',
  errorTitle = 'Có lỗi xảy ra',
  successMsg = 'Đã lưu thay đổi.',
  errorMsg = 'Không thể lưu thay đổi.',
  options = {},
}: UseEditApiParams<TData, TBody>) {
  const queryClient = useQueryClient();
  const { onError, onSuccess, ...mutationOptions } = options;

  return useMutation<ApiResponse<TData>, ApiError, EditVariables<TBody>>({
    ...mutationOptions,
    mutationFn: ({ data }) => api<TData>({ url, method, data }),
    onSuccess: async (response, variables, onMutateResult, context) => {
      if (variables.invalidateKey?.length) {
        await queryClient.invalidateQueries({
          queryKey: variables.invalidateKey,
        });
      }

      if (useAlert) {
        Alert.alert(successTitle, variables.successMsg ?? successMsg);
      }

      await onSuccess?.(response, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      if (useAlert && showError) {
        Alert.alert(
          errorTitle,
          variables.errorMsg ?? error.response?.data?.message ?? errorMsg,
        );
      }

      await onError?.(error, variables, onMutateResult, context);
    },
  });
}
