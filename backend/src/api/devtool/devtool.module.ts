import { Module } from '@nestjs/common';
import { DevtoolService } from './devtool.service';
import { DevtoolController } from './devtool.controller';
import { DevtoolTokenGuard } from './devtool-token.guard';
import { RepositoryModule } from '@/repository/repository.module';
import { DeliveryNotiQueueModule } from '@/queue/delivery-noti-queue/delivery-noti-queue.module';
import { FirebaseModule } from '@/shared/firebase/firebase.module';
import { ContentDeliveryModule } from '@/api/content-delivery/content-delivery.module';

@Module({
  controllers: [DevtoolController],
  providers: [DevtoolService, DevtoolTokenGuard],
  imports: [
    RepositoryModule,
    DeliveryNotiQueueModule,
    FirebaseModule,
    ContentDeliveryModule,
    RepositoryModule,
  ],
})
export class DevtoolModule {}
