import { Injectable } from '@nestjs/common';
import { SendNotificationService } from './send-notification.service';
import { Cron } from '@nestjs/schedule';
import { SCHEDULER_TIMEZONE } from '@/const/cron';

@Injectable()
export class SendNotificationSchedule {
  constructor(
    private readonly sendNotificationService: SendNotificationService,
  ) {}
  @Cron('0 0 5 * * *', { timeZone: SCHEDULER_TIMEZONE })
  sendAtFive() {
    return this.sendNotificationService.scheduleNotifications(5);
  }

  @Cron('0 0 6 * * *', { timeZone: SCHEDULER_TIMEZONE })
  sendAtSix() {
    return this.sendNotificationService.scheduleNotifications(6);
  }

  @Cron('0 0 7 * * *', { timeZone: SCHEDULER_TIMEZONE })
  sendAtSeven() {
    return this.sendNotificationService.scheduleNotifications(7);
  }
  // @Cron(' * * * * * *')
  // log() {
  //   console.log('....');
  // }
}
