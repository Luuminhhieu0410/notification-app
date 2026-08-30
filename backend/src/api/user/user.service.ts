import { BadRequestException, Injectable } from '@nestjs/common';
import { PostgresService } from '@/shared/postgres/postgres.service';
import { UserRepository } from '@/repository/user.repository';
import { NotificationSettingRepository } from '@/repository/notification-setting.repository';

export interface BootstrapUserInput {
  timezone: string;
  locale: string;
  platform: string;
  deviceName?: string | null;
  osVersion?: string | null;
  appVersion?: string | null;
  pushToken?: string | null;
}

@Injectable()
export class UserService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly userRepository: UserRepository,
    private readonly notificationSettingRepository: NotificationSettingRepository,
  ) {}

  async bootstrap(input: BootstrapUserInput) {
    const data = this.normalizeInput(input);
    const { pushToken, ...userData } = data;
    const client = this.postgresService.getClient();

    const result = await client.$transaction(async (transaction) => {
      const user = await this.userRepository.createUser(userData, transaction);
      const setting = await this.notificationSettingRepository.upsertDefault(
        user.id,
        transaction,
      );
      if (pushToken) {
        await this.userRepository.assignPushToken(
          user.id,
          pushToken,
          transaction,
        );
      }

      return { deviceRegistered: Boolean(pushToken), setting, user };
    });

    return {
      user: result.user,
      setting: {
        enabled: result.setting.enabled,
        notificationHour: result.setting.localSendTime.getUTCHours(),
      },
      deviceRegistered: result.deviceRegistered,
    };
  }
  updateUserToken(userId: string, token: string) {
    return this.userRepository.assignPushToken(userId, token);
  }
  private normalizeInput(input: BootstrapUserInput) {
    const timezone = this.requiredString(input.timezone, 'timezone', 100);
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    } catch {
      throw new BadRequestException('timezone is invalid');
    }

    return {
      timezone,
      locale: this.requiredString(input.locale, 'locale', 20),
      platform: this.requiredString(input.platform, 'platform', 20),
      deviceName: this.optionalString(input.deviceName, 150),
      osVersion: this.optionalString(input.osVersion, 50),
      appVersion: this.optionalString(input.appVersion, 50),
      pushToken: this.optionalString(input.pushToken, 255),
    };
  }

  private requiredString(value: unknown, name: string, maxLength: number) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${name} is required`);
    }
    return value.trim().slice(0, maxLength);
  }

  private optionalString(value: unknown, maxLength: number) {
    return typeof value === 'string' && value.trim()
      ? value.trim().slice(0, maxLength)
      : null;
  }
}
