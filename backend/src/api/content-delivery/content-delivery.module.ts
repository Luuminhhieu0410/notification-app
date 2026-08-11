import { Module } from '@nestjs/common';
import { PostgresModule } from '@/shared/postgres/postgres.module';
import { ContentDeliveryController } from './content-delivery.controller';
import { ContentDeliveryService } from './content-delivery.service';

@Module({
  imports: [PostgresModule],
  controllers: [ContentDeliveryController],
  providers: [ContentDeliveryService],
})
export class ContentDeliveryModule {}
