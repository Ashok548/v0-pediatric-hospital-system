import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

interface OpenRouterMessage {
  role: 'system' | 'user';
  content: string;
}

interface OpenRouterCompletionRequest {
  model: string;
  temperature: number;
  max_tokens?: number;
  messages: OpenRouterMessage[];
}

interface OpenRouterCompletionResponse {
  choices: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

interface OpenRouterClientLike {
  chat: {
    completions: {
      create: (
        request: OpenRouterCompletionRequest,
      ) => Promise<OpenRouterCompletionResponse>;
    };
  };
}

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly client: OpenRouterClientLike;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('OPENROUTER_API_KEY')?.trim() ?? '';

    if (!apiKey) {
      throw new InternalServerErrorException(
        'OpenRouter API key is not configured.',
      );
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    }) as unknown as OpenRouterClientLike;
  }

  async formatMedicalText(text: string): Promise<string> {
    const cleanText = text.trim();
    if (!cleanText) {
      return '';
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'arcee-ai/trinity-large-preview:free',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: [
              'You are a pediatric clinical documentation assistant.',
              'Convert raw doctor dictation into structured medical instructions.',
              'Rules:',
              '- Identify medications explicitly mentioned in the dictation.',
              '- Extract dose and frequency when present.',
              '- Convert units into medical abbreviations such as mg, g/kg, and mEq/kg.',
              '- Return clear bullet points only.',
              '- Do not hallucinate medical data or add details not present in the dictation.',
            ].join('\n'),
          },
          {
            role: 'user',
            content: cleanText,
          },
        ],
      });

      const formatted = response.choices[0]?.message?.content?.trim() ?? '';
      if (!formatted) {
        throw new Error('OpenRouter returned an empty formatted response.');
      }

      return formatted;
    } catch (error) {
      this.logger.error(
        `Medical formatting failed: ${this.getErrorMessage(error)}`,
      );
      throw new InternalServerErrorException(
        'Failed to format medical dictation. Please try again shortly.',
      );
    }
  }

  async generateDischargeSummary(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const cleanSystemPrompt = systemPrompt.trim();
    const cleanUserPrompt = userPrompt.trim();

    if (!cleanSystemPrompt || !cleanUserPrompt) {
      throw new InternalServerErrorException(
        'Discharge summary prompt is incomplete.',
      );
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'arcee-ai/trinity-large-preview:free',
        temperature: 0.2,
        max_tokens: 2000,
        messages: [
          {
            role: 'system',
            content: cleanSystemPrompt,
          },
          {
            role: 'user',
            content: cleanUserPrompt,
          },
        ],
      });

      const summary = response.choices[0]?.message?.content?.trim() ?? '';
      if (!summary) {
        throw new Error('OpenRouter returned an empty discharge summary.');
      }

      return summary;
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.logger.error(`Discharge summary generation failed: ${msg}`);
      if (error != null && typeof error === 'object' && 'status' in error) {
        const httpStatus = (error as { status: number }).status;
        if (httpStatus === 429) {
          throw new InternalServerErrorException(
            'AI service is temporarily rate-limited. Please retry in a moment.',
          );
        }
        if (httpStatus === 400 || httpStatus === 413) {
          throw new InternalServerErrorException(
            'Patient record is too large for the AI model. Please contact support.',
          );
        }
      }
      throw new InternalServerErrorException(
        'Failed to generate discharge summary. Please try again shortly.',
      );
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }
}
