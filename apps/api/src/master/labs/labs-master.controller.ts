import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { LabsMasterService } from './labs-master.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('master/lab-profiles')
export class LabsMasterController {
    constructor(private readonly labsMasterService: LabsMasterService) { }

    @Get()
    findAll() {
        return this.labsMasterService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.labsMasterService.findOne(id);
    }
}
