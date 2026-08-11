import { Module } from '@nestjs/common';
import { PostgresModule } from '@/shared/postgres/postgres.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [PostgresModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
