import { Controller, Get, Header, ParseUUIDPipe, Query } from '@nestjs/common';
import { ContentDeliveryService } from './content-delivery.service';

@Controller('content-delivery')
export class ContentDeliveryController {
  constructor(
    private readonly contentDeliveryService: ContentDeliveryService,
  ) {}

  @Get('today')
  @Header('Cache-Control', 'no-store')
  getToday(@Query('userId', new ParseUUIDPipe()) userId: string) {
    return this.contentDeliveryService.getOrCreateToday(userId);
  }
}
