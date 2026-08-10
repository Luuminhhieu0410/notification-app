import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DevtoolService } from './devtool.service';
import { DevtoolTokenGuard } from './devtool-token.guard';

@Controller('devtool')
@UseGuards(DevtoolTokenGuard)
export class DevtoolController {
  constructor(private readonly devtoolService: DevtoolService) {}
  @Post('send-test')
  send(@Req() request: Request) {
    const fcmToken: string = request.headers['token'] as string;
    if (!fcmToken) {
      throw new BadRequestException();
    }
    return this.devtoolService.sendNotiWithToken(fcmToken);
  }
}
