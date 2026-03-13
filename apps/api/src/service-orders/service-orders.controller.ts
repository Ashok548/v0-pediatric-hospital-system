import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('service-orders')
export class ServiceOrdersController {
    constructor(private readonly serviceOrdersService: ServiceOrdersService) { }

    @Post()
    createOrder(@Body() createDto: CreateServiceOrderDto, @Request() req: any) {
        return this.serviceOrdersService.createOrder(createDto, req.user.id);
    }

    @Get('admission/:admissionId')
    findByAdmission(@Param('admissionId') admissionId: string) {
        return this.serviceOrdersService.findByAdmission(admissionId);
    }
}
