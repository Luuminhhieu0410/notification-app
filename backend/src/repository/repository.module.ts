import { Module } from '@nestjs/common';
import { NotificationSettingRepository } from './notification-setting.repository';
import { PostgresModule } from '@/shared/postgres/postgres.module';
import { UserRepository } from './user.repository';
import { ContentDeliveryRepository } from './content-delivery.repository';
import { ContentRepository } from './content.repository';

const repositories = [
  UserRepository,
  NotificationSettingRepository,
  ContentDeliveryRepository,
  ContentRepository,
];

@Module({
  providers: repositories,
  exports: repositories,
  imports: [PostgresModule],
})
export class RepositoryModule {}
