import { Injectable } from '@nestjs/common';
import { PostgresService } from '@/shared/postgres/postgres.service';

@Injectable()
export class NotificationSettingRepository {
  constructor(private readonly postgresService: PostgresService) {}
}
