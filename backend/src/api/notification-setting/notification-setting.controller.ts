import { Controller } from '@nestjs/common';
import { NotificationSettingService } from './notification-setting.service';

@Controller('notification-SettingPage')
export class NotificationSettingController {
  constructor(
    private readonly notificationSettingService: NotificationSettingService,
  ) {}
}
