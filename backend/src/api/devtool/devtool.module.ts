import { Module } from '@nestjs/common';
import { DevtoolService } from './devtool.service';
import { DevtoolController } from './devtool.controller';
import { DevtoolTokenGuard } from './devtool-token.guard';
import { RepositoryModule } from '@/repository/repository.module';
import { DeliveryNotiQueueModule } from '@/queue/delivery-noti-queue/delivery-noti-queue.module';

@Module({
  controllers: [DevtoolController],
  providers: [DevtoolService, DevtoolTokenGuard],
  imports: [RepositoryModule, DeliveryNotiQueueModule],
})
export class DevtoolModule {}
