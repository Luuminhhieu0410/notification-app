import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationSettingModule } from '@/api/notification-setting/notification-setting.module';
import { RepositoryModule } from './repository/repository.module';
import { PostgresModule } from './shared/postgres/postgres.module';
import { join, resolve } from 'node:path';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './shared/redis/redis.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiResponseInterceptor } from '@/shared/http/api-response.interceptor';
import { ApiExceptionFilter } from '@/shared/http/api-exception.filter';

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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
