import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationSettingRepository } from '@/repository/notification-setting.repository';

export interface NotificationTimeOptions {
  availableHours: number[];
  defaultHour: number;
}

export interface UpdateNotificationSettingInput {
  userId: string;
  enabled: boolean;
  notificationHour: number;
}

@Injectable()
export class NotificationSettingService {
  private readonly availableHours = [5, 6, 7];

  constructor(
    private readonly notificationSettingRepository: NotificationSettingRepository,
  ) {}

  getTimeOptions(): NotificationTimeOptions {
    return {
      availableHours: [...this.availableHours],
      defaultHour: 7,
    };
  }

  async getSetting(userId: string) {
    const setting =
      await this.notificationSettingRepository.upsertDefault(userId);
    return this.toResponse(setting);
  }

  async updateSetting(input: UpdateNotificationSettingInput) {
    if (typeof input.enabled !== 'boolean') {
      throw new BadRequestException('enabled must be a boolean');
    }
    if (
      !Number.isInteger(input.notificationHour) ||
      !this.availableHours.includes(input.notificationHour)
    ) {
      throw new BadRequestException('notificationHour is not supported');
    }

    const localSendTime = new Date(
      Date.UTC(1970, 0, 1, input.notificationHour),
    );
    const setting = await this.notificationSettingRepository.upsertPreferences(
      input.userId,
      input.enabled,
      localSendTime,
    );
    return this.toResponse(setting);
  }

  private toResponse(setting: { enabled: boolean; localSendTime: Date }) {
    return {
      enabled: setting.enabled,
      notificationHour: setting.localSendTime.getUTCHours(),
    };
  }
}
