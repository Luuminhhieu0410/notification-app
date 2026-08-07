import { Module } from '@nestjs/common';
import { NotificationSettingRepository } from './notification-setting.repository';
import { PostgresModule } from '@/shared/postgres/postgres.module';

@Module({
  providers: [NotificationSettingRepository],
  imports: [PostgresModule],
})
export class RepositoryModule {}
