import {
  Body,
  Controller,
  Get,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import type {
  NotificationTimeOptions,
  UpdateNotificationSettingInput,
} from './notification-setting.service';
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

  @Get()
  getSetting(@Query('userId', new ParseUUIDPipe()) userId: string) {
    return this.notificationSettingService.getSetting(userId);
  }

  @Patch()
  updateSetting(
    @Body() input: UpdateNotificationSettingInput,
    @Body('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.notificationSettingService.updateSetting({ ...input, userId });
  }
}
