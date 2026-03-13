import { Module } from '@nestjs/common';
import { LabsMasterController } from './labs-master.controller';
import { LabsMasterService } from './labs-master.service';

@Module({
    controllers: [LabsMasterController],
    providers: [LabsMasterService],
    exports: [LabsMasterService]
})
export class LabsMasterModule { }
