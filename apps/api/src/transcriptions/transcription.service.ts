import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DeepgramService } from '../services/deepgramService';
import { UploadedAudioFile } from './uploaded-audio-file.type';

const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class TranscriptionService {
  constructor(private readonly deepgramService: DeepgramService) {}

  async transcribe(
    file: UploadedAudioFile | undefined,
  ): Promise<{ text: string }> {
    if (!file) {
      throw new BadRequestException(
        'Audio file is required under field name "audio".',
      );
    }

    if (!file.buffer || file.size <= 0) {
      throw new BadRequestException('Uploaded audio file is empty.');
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      throw new BadRequestException(
        'Audio file is too large. Maximum allowed size is 10MB.',
      );
    }

    // Browser-recorded files are expected to be webm; keep the endpoint strict.
    const mimeType = (file.mimetype || '').toLowerCase();
    if (
      !mimeType.startsWith('audio/webm') &&
      mimeType !== 'application/octet-stream'
    ) {
      throw new BadRequestException(
        'Unsupported file type. Please upload a WEBM audio recording.',
      );
    }

    try {
      const text = await this.deepgramService.transcribeWebm(file.buffer);

      if (!text) {
        throw new BadRequestException(
          'No speech detected in the recording. Please try again.',
        );
      }

      return { text };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to transcribe audio. Please try again shortly.',
      );
    }
  }
}
