import { Body, Controller, Post } from '@nestjs/common';
import type { BootstrapUserInput } from './user.service';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('bootstrap')
  bootstrap(@Body() input: BootstrapUserInput) {
    return this.userService.bootstrap(input);
  }
}
