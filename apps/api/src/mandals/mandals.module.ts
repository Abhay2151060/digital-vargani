import { Module } from '@nestjs/common';
import { MandalsController } from './mandals.controller';
import { MandalsService } from './mandals.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MandalsController],
  providers: [MandalsService],
  exports: [MandalsService],
})
export class MandalsModule {}
