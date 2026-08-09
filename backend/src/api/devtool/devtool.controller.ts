import { Controller, Get } from '@nestjs/common';
import { DevtoolService } from './devtool.service';

@Controller('devtool')
export class DevtoolController {
  constructor(private readonly devtoolService: DevtoolService) {}
  @Get('send-test')
  send() {
    return this.devtoolService.sendNotiWithToken();
  }
}
