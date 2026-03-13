import { Module } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { ServiceOrdersController } from './service-orders.controller';

@Module({
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
