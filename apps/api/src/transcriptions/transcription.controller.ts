import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TranscriptionService } from './transcription.service';
import { UploadedAudioFile } from './uploaded-audio-file.type';

@Controller('transcribe')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Post()
  @Roles('ADMIN', 'DOCTOR', 'NURSE')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(@UploadedFile() file: UploadedAudioFile | undefined) {
    return this.transcriptionService.transcribe(file);
  }
}
