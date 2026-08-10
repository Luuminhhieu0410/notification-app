import { Injectable } from '@nestjs/common';

export interface NotificationTimeOptions {
  availableHours: number[];
  defaultHour: number;
}

@Injectable()
export class NotificationSettingService {
  private readonly availableHours = [5, 6, 7, 8, 9, 10, 11, 12, 13];

  getTimeOptions(): NotificationTimeOptions {
    return {
      availableHours: [...this.availableHours],
      defaultHour: 7,
    };
  }
}
