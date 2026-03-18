import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MedicalFormatController } from './medical-format.controller';
import { OpenRouterService } from '../services/openRouterService';

@Module({
  imports: [ConfigModule],
  controllers: [MedicalFormatController],
  providers: [OpenRouterService],
  exports: [OpenRouterService],
})
export class MedicalFormatModule {}
