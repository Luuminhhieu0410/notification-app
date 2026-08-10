import { Injectable } from '@nestjs/common';
import { FirebaseService } from '@/shared/firebase/firebase.service';

@Injectable()
export class DevtoolService {
  constructor(private firebaseService: FirebaseService) {}
  async sendNotiWithToken(token: string) {
    await this.firebaseService.getMessaging().send({
      token,

      notification: {
        title: 'hehe',
        body: 'body ne',
      },

      data: {
        type: 'test',
        message: 'body ne',
      },

      android: {
        priority: 'high',
      },
    });
    return 'ok';
  }
}
