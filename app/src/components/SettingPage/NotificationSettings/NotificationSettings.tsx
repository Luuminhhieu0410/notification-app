import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import type { NotificationTimeOptions } from '@/constants/setting/hour';
import { BrandFonts } from '@/constants/theme';
import { supportsLocalDatabase } from '@/databases/initialize';
import { getLocalUser } from '@/databases/repositories/user.repository';
import useEditApi from '@/hooks/api/useEditApi';
import useFetchApi from '@/hooks/api/useFetchApi';
import { useTheme } from '@/hooks/use-theme';
import { showShortToast } from '@/helpers/toast/showShortToast';

interface NotificationSettingResponse {
  enabled: boolean;
  notificationHour: number;
}

interface UpdateNotificationSettingInput extends NotificationSettingResponse {
  userId: string;
}

const SETTING_DEBOUNCE_MS = 450;

export function NotificationSettings() {
  const theme = useTheme();
  const [enabled, setEnabled] = useState(true);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const lastSavedSetting = useRef<string | null>(null);
  const localUserQuery = useQuery({
    queryKey: ['local', 'user'],
    queryFn: getLocalUser,
    enabled: supportsLocalDatabase(),
  });
  const userId = localUserQuery.data?.backendUserId ?? null;
  const settingQueryKey = useMemo(
    () => ['notification-setting', 'current', userId] as const,
    [userId],
  );
  const settingQuery = useFetchApi<NotificationSettingResponse>({
    url: '/notification-setting',
    params: { userId },
    queryKey: settingQueryKey,
    enabled: Boolean(userId),
    useToast: true,
    showError: true,
    errorMsg: 'Không thể tải cài đặt thông báo.',
  });
  const timeOptionsQuery = useFetchApi<NotificationTimeOptions>({
    url: '/notification-setting/time-options',
    queryKey: ['notification-setting', 'time-options'],
  });
  const availableHours = Array.isArray(timeOptionsQuery.data?.availableHours)
    ? timeOptionsQuery.data.availableHours.filter(
        (hour, index, values) =>
          Number.isInteger(hour) &&
          hour >= 0 &&
          hour <= 23 &&
          values.indexOf(hour) === index,
      )
    : [];
  const defaultHour = availableHours.includes(
    timeOptionsQuery.data?.defaultHour ?? -1,
  )
    ? (timeOptionsQuery.data?.defaultHour ?? null)
    : (availableHours[0] ?? null);
  const currentHour =
    selectedHour !== null && availableHours.includes(selectedHour)
      ? selectedHour
      : defaultHour;
  const hasTimeOptionsError =
    Boolean(timeOptionsQuery.error) ||
    (timeOptionsQuery.fetched && availableHours.length === 0);
  const updateSetting = useEditApi<
    NotificationSettingResponse,
    UpdateNotificationSettingInput
  >({
    url: '/notification-setting',
    method: 'PATCH',
    useToast: true,
    options: {
      onSuccess: (_response, variables) => {
        lastSavedSetting.current = JSON.stringify(variables.data);
      },
      onError: () => {
        const remoteSetting = settingQuery.data;
        if (remoteSetting && userId) {
          setEnabled(remoteSetting.enabled);
          setSelectedHour(remoteSetting.notificationHour);
          lastSavedSetting.current = JSON.stringify({
            userId,
            enabled: remoteSetting.enabled,
            notificationHour: remoteSetting.notificationHour,
          });
        }
        showShortToast('Không thể lưu. Đã khôi phục cài đặt trước đó.');
        return settingQuery.refetch();
      },
    },
  });
  const mutateSetting = updateSetting.mutate;

  useEffect(() => {
    const setting = settingQuery.data;
    if (!setting || !userId) return;

    setEnabled(setting.enabled);
    setSelectedHour(setting.notificationHour);
    lastSavedSetting.current = JSON.stringify({
      userId,
      enabled: setting.enabled,
      notificationHour: setting.notificationHour,
    });
  }, [settingQuery.data, userId]);

  useEffect(() => {
    if (!userId || !settingQuery.fetched || selectedHour === null) return;

    const data: UpdateNotificationSettingInput = {
      userId,
      enabled,
      notificationHour: selectedHour,
    };
    if (JSON.stringify(data) === lastSavedSetting.current) return;

    const timeout = setTimeout(() => {
      mutateSetting({ data, invalidateKey: settingQueryKey });
    }, SETTING_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [
    enabled,
    mutateSetting,
    selectedHour,
    settingQuery.fetched,
    settingQueryKey,
    userId,
  ]);

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View
        style={[
          styles.row,
          styles.rowDivider,
          { borderBottomColor: theme.divider },
        ]}
      >
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, { color: theme.text }]}>
            Thông báo mỗi ngày
          </Text>
          <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
            Nhận một câu mới vào mỗi buổi sáng
          </Text>
        </View>
        <Switch
          accessibilityLabel="Thông báo mỗi ngày"
          disabled={!settingQuery.fetched}
          onValueChange={setEnabled}
          trackColor={{ false: theme.control, true: theme.primary }}
          thumbColor="#FFFFFF"
          value={enabled}
        />
      </View>

      <View
        accessibilityLabel={
          currentHour === null
            ? 'Giờ thông báo'
            : `Giờ thông báo, hiện tại ${currentHour} giờ`
        }
        style={[styles.row, styles.timeRow, !enabled && styles.disabled]}
      >
        <Text style={[styles.rowTitle, { color: theme.text }]}>Thời gian</Text>
        {availableHours.length > 0 ? (
          <View style={styles.timeOptions}>
            {availableHours.map((hour) => {
              const selected = hour === currentHour;
              const disabled = !enabled || !settingQuery.fetched;
              return (
                <Pressable
                  accessibilityLabel={`${hour} giờ sáng`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled }}
                  disabled={disabled}
                  key={hour}
                  onPress={() => setSelectedHour(hour)}
                  style={({ pressed }) => [
                    styles.timeOption,
                    { backgroundColor: theme.control },
                    selected && { backgroundColor: theme.primary },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      {
                        color: selected
                          ? theme.backgroundElement
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    {hour} giờ
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : hasTimeOptionsError ? (
          <View style={styles.timeOptionsStatus}>
            <Text
              accessibilityLiveRegion="polite"
              style={[
                styles.timeOptionsStatusText,
                { color: theme.textSecondary },
              ]}
            >
              Không tải được khung giờ.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void timeOptionsQuery.refetch()}
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: theme.primarySoft },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.retryButtonText, { color: theme.primary }]}>
                Thử lại
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text
            accessibilityLiveRegion="polite"
            style={[
              styles.timeOptionsStatusText,
              { color: theme.textSecondary },
            ]}
          >
            Đang tải khung giờ…
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden' },
  row: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: BrandFonts.medium, fontSize: 15, lineHeight: 22 },
  rowDescription: {
    fontFamily: BrandFonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  timeRow: { alignItems: 'flex-start', flexDirection: 'column', gap: 12 },
  timeOptions: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    flexBasis: '31%',
    flexGrow: 1,
    maxWidth: '32%',
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOptionText: {
    fontFamily: BrandFonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  timeOptionsStatus: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeOptionsStatusText: {
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontFamily: BrandFonts.semiBold,
    fontSize: 13,
    lineHeight: 20,
  },
  pressed: { opacity: 0.62, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.42 },
});
