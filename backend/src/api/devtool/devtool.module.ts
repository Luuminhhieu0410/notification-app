import { Module } from '@nestjs/common';
import { DevtoolService } from './devtool.service';
import { DevtoolController } from './devtool.controller';
import { FirebaseModule } from '@/shared/firebase/firebase.module';
import { DevtoolTokenGuard } from './devtool-token.guard';

@Module({
  controllers: [DevtoolController],
  providers: [DevtoolService, DevtoolTokenGuard],
  imports: [FirebaseModule],
})
export class DevtoolModule {}
