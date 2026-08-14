import {
  Controller,
  Get,
  Header,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ContentDeliveryService } from './content-delivery.service';

@Controller('content-delivery')
export class ContentDeliveryController {
  constructor(
    private readonly contentDeliveryService: ContentDeliveryService,
  ) {}

  @Get('current')
  @Header('Cache-Control', 'no-store')
  getCurrent(@Query('userId', new ParseUUIDPipe()) userId: string) {
    return this.contentDeliveryService.getCurrent(userId);
  }

  // @Get('today')
  // @Header('Cache-Control', 'no-store')
  // getToday(@Query('userId', new ParseUUIDPipe()) userId: string) {
  //   return this.contentDeliveryService.getCurrent(userId);
  // }

  @Post('next')
  @Header('Cache-Control', 'no-store')
  createNext(@Query('userId', new ParseUUIDPipe()) userId: string) {
    return this.contentDeliveryService.createNext(userId);
  }
}
