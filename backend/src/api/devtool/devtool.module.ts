import { Module } from '@nestjs/common';
import { DevtoolService } from './devtool.service';
import { DevtoolController } from './devtool.controller';
import { FirebaseModule } from '@/shared/firebase/firebase.module';

@Module({
  controllers: [DevtoolController],
  providers: [DevtoolService],
  imports: [FirebaseModule],
})
export class DevtoolModule {}
