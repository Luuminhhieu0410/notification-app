import {
  type QueryKey,
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { api, type ApiResponse } from '@/helpers/api';
import { showShortToast } from '@/helpers/toast/showShortToast';

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
  useToast?: boolean;
  showError?: boolean;
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
  useToast = true,
  showError = true,
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

      if (useToast) {
        showShortToast(variables.successMsg ?? successMsg);
      }

      await onSuccess?.(response, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      if (useToast && showError) {
        showShortToast(
          variables.errorMsg ?? error.response?.data?.message ?? errorMsg,
        );
      }

      await onError?.(error, variables, onMutateResult, context);
    },
  });
}
