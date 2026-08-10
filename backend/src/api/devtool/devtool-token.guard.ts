import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

const DEVTOOL_TOKEN = 'dev-token-123';

@Injectable()
export class DevtoolTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-devtool-token'];

    if (token !== DEVTOOL_TOKEN) {
      throw new UnauthorizedException('Invalid devtool token');
    }

    return true;
  }
}
