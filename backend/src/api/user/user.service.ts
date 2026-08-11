import { BadRequestException, Injectable } from '@nestjs/common';
import { PostgresService } from '@/shared/postgres/postgres.service';

export interface BootstrapUserInput {
  installationId: string;
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
  constructor(private readonly postgresService: PostgresService) {}

  async bootstrap(input: BootstrapUserInput) {
    const data = this.normalizeInput(input);
    const { pushToken, ...userData } = data;
    const client = this.postgresService.getClient();

    const result = await client.$transaction(async (transaction) => {
      const user = await transaction.user.upsert({
        where: { installationId: userData.installationId },
        create: userData,
        update: {
          timezone: userData.timezone,
          locale: userData.locale,
          platform: userData.platform,
          deviceName: userData.deviceName,
          osVersion: userData.osVersion,
          appVersion: userData.appVersion,
        },
      });
      const setting = await transaction.notificationSetting.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });
      if (pushToken) {
        await transaction.userDevice.upsert({
          where: { pushToken },
          create: {
            userId: user.id,
            pushToken,
            platform: userData.platform,
          },
          update: {
            userId: user.id,
            platform: userData.platform,
            enabled: true,
            lastSeenAt: new Date(),
          },
        });
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

  private normalizeInput(input: BootstrapUserInput) {
    const installationId = this.requiredString(
      input.installationId,
      'installationId',
      100,
    );
    if (!/^[A-Za-z0-9._:-]{16,100}$/.test(installationId)) {
      throw new BadRequestException('installationId is invalid');
    }

    const timezone = this.requiredString(input.timezone, 'timezone', 100);
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    } catch {
      throw new BadRequestException('timezone is invalid');
    }

    return {
      installationId,
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
