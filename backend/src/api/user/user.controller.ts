import { Body, Controller, Post, Put } from '@nestjs/common';
import type { BootstrapUserInput } from './user.service';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('bootstrap')
  bootstrap(@Body() input: BootstrapUserInput) {
    return this.userService.bootstrap(input);
  }
  @Put('token')
  updateToken(@Body() input: { userId: string; token: string }) {
    console.log(
      'update token for user: ',
      input.userId,
      ' token: ',
      input.token,
    );
    return this.userService.updateUserToken(input.userId, input.token);
  }
}
