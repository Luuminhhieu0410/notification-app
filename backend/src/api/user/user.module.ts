import { Module } from '@nestjs/common';
import { PostgresModule } from '@/shared/postgres/postgres.module';
import { RepositoryModule } from '@/repository/repository.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [PostgresModule, RepositoryModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
