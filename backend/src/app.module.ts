import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationSettingModule } from '@/api/notification-setting/notification-setting.module';
import { RepositoryModule } from './repository/repository.module';
import { PostgresModule } from './shared/postgres/postgres.module';
import { join, resolve } from 'node:path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from './shared/redis/redis.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiResponseInterceptor } from '@/shared/http/api-response.interceptor';
import { ApiExceptionFilter } from '@/shared/http/api-exception.filter';
import { ScheduleModule } from '@nestjs/schedule';
import { FirebaseModule } from './shared/firebase/firebase.module';
import { DevtoolModule } from './api/devtool/devtool.module';
import { UserModule } from './api/user/user.module';
import { ContentDeliveryModule } from './api/content-delivery/content-delivery.module';
import { SendNotificationModule } from './cron/send-notification.module';
import { DeliveryNotiQueueModule } from './queue/delivery-noti-queue/delivery-noti-queue.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    NotificationSettingModule,
    RepositoryModule,
    PostgresModule,
    ConfigModule.forRoot({
      envFilePath: join(resolve(), '.env'),
      isGlobal: true,
    }),
    RedisModule,
    ScheduleModule.forRoot(),
    FirebaseModule,
    DevtoolModule,
    UserModule,
    ContentDeliveryModule,
    SendNotificationModule,
    DeliveryNotiQueueModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        connection: {
          host: cfg.get<string>('REDIS_HOST') ?? '127.0.0.1',
          port: cfg.get<number>('REDIS_PORT') ?? 6379,
          password: cfg.get<string>('REDIS_PASSWORD') ?? undefined,
        },
        // tuỳ chỉnh chung cho tất cả queue (có thể ghi đè ở mức queue)
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
