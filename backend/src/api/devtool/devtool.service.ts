import { Injectable } from '@nestjs/common';
import { FirebaseService } from '@/shared/firebase/firebase.service';

@Injectable()
export class DevtoolService {
  constructor(private firebaseService: FirebaseService) {}
  async sendNotiWithToken(
    token: string = 'dup8bx1dRJS2Ek3_HYdX7k:APA91bHXoVm-OTaYEQ1WAkJ1jv2BS4Sy0X08MYZ_1kjqbnY-lOMMD3VlS3TIpbpMErdxZuUZeDINoujnxOcRtUf7nq-lLfMH4K5JLX3VlG9poYtPqDVB5FE',
  ) {
    await this.firebaseService.getMessaging().send({
      token,
      android: { notification: { title: 'hehe', body: 'body ne' } },
    });
    return 'ok';
  }
}
