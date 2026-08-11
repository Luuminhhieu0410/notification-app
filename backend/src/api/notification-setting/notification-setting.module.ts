import { Module } from '@nestjs/common';
import { NotificationSettingService } from './notification-setting.service';
import { NotificationSettingController } from './notification-setting.controller';
import { PostgresModule } from '@/shared/postgres/postgres.module';

@Module({
  imports: [PostgresModule],
  controllers: [NotificationSettingController],
  providers: [NotificationSettingService],
})
export class NotificationSettingModule {}
