import { Controller, Get } from '@nestjs/common';
import type { NotificationTimeOptions } from './notification-setting.service';
import { NotificationSettingService } from './notification-setting.service';

@Controller('notification-setting')
export class NotificationSettingController {
  constructor(
    private readonly notificationSettingService: NotificationSettingService,
  ) {}

  @Get('time-options')
  getTimeOptions(): NotificationTimeOptions {
    return this.notificationSettingService.getTimeOptions();
  }
}
