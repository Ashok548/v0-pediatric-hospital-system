import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';
import { DeepgramService } from '../services/deepgramService';

@Module({
  imports: [ConfigModule],
  controllers: [TranscriptionController],
  providers: [TranscriptionService, DeepgramService],
})
export class TranscriptionsModule {}
