import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpenRouterService } from '../services/openRouterService';
import { FormatTextDto } from './dto/format-text.dto';

@Controller('medical-format')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalFormatController {
  constructor(private readonly openRouterService: OpenRouterService) {}

  @Post()
  @Roles('ADMIN', 'DOCTOR', 'NURSE')
  async format(@Body() body: FormatTextDto): Promise<{ formatted: string }> {
    const formatted = await this.openRouterService.formatMedicalText(body.text);
    return { formatted };
  }
}
