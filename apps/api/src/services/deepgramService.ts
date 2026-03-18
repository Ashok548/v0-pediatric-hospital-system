import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface DeepgramAlternative {
  transcript: string;
}

interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

interface DeepgramUtterance {
  transcript: string;
}

interface DeepgramPayload {
  results: {
    channels: DeepgramChannel[];
    utterances?: DeepgramUtterance[];
  };
}

@Injectable()
export class DeepgramService {
  private readonly logger = new Logger(DeepgramService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('DEEPGRAM_API_KEY')?.trim() ?? '';
  }

  async transcribeWebm(audioBuffer: Buffer): Promise<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'Deepgram API key is not configured.',
      );
    }

    try {
      console.time('deepgram');
      const response = await axios.post<DeepgramPayload>(
        'https://api.deepgram.com/v1/listen',
        audioBuffer,
        {
          params: {
            model: 'nova-3',
            smart_format: true,
            punctuate: true,
            numerals: true,
            utterances: true,
          },
          headers: {
            Authorization: `Token ${this.apiKey}`,
            'Content-Type': 'audio/webm',
          },
          timeout: 30_000,
        },
      );
      console.timeEnd('deepgram');
      response.data.results?.utterances?.forEach(
        (utterance: DeepgramUtterance) => {
          console.log(`• ${utterance.transcript}`);
        },
      );
      return this.extractTranscript(response.data);
    } catch (error) {
      this.logger.error(
        `Deepgram transcription failed: ${this.getErrorMessage(error)}`,
      );
      throw new InternalServerErrorException(
        'Failed to transcribe audio. Please try again shortly.',
      );
    }
  }

  private extractTranscript(payload: DeepgramPayload): string {
    const transcript =
      payload?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    if (typeof transcript !== 'string') {
      return '';
    }

    return transcript
      .trim()
      .replace(/milligrams/gi, 'mg')
      .replace(/milligram/gi, 'mg')
      .replace(/milliliters/gi, 'ml')
      .replace(/milliliter/gi, 'ml')
      .replace(/kilograms/gi, 'kg')
      .replace(/kilogram/gi, 'kg');
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }
}
