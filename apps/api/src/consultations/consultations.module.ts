import { Module, forwardRef } from '@nestjs/common';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { OPVisitsModule } from '../op-visits/op-visits.module';

@Module({
  imports: [forwardRef(() => OPVisitsModule)],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
