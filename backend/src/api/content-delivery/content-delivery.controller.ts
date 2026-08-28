import {
  Controller,
  Get,
  Header,
  Param,
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

  @Get(':deliveryId/previous')
  @Header('Cache-Control', 'no-store')
  getPrevious(
    @Param('deliveryId', new ParseUUIDPipe()) deliveryId: string,
    @Query('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.contentDeliveryService.getPrevious(userId, deliveryId);
  }

  @Get(':deliveryId')
  @Header('Cache-Control', 'no-store')
  getById(
    @Param('deliveryId', new ParseUUIDPipe()) deliveryId: string,
    @Query('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.contentDeliveryService.getById(userId, deliveryId);
  }

  @Post(':deliveryId/next')
  @Header('Cache-Control', 'no-store')
  getNext(
    @Param('deliveryId', new ParseUUIDPipe()) deliveryId: string,
    @Query('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.contentDeliveryService.getNext(userId, deliveryId);
  }
}
