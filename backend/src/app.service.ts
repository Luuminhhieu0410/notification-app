import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  // @Cron('*/1 * * * * *')
  // async dispatchDailyNotifications() {
  //   await delay(10000);
  //   console.log('DONE!');
  // }
}
