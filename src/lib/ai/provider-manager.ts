import type { AIProvider, GenerateRequest, GenerateResponse } from './types';
import { DeepSeekProvider } from './providers/deepseek';
import { OpenAIProvider } from './providers/openai';

export class AIProviderManager {
  private providers: Map<string, AIProvider>;

  constructor() {
    this.providers = new Map([
      ['deepseek', new DeepSeekProvider()],
      ['openai', new OpenAIProvider()],
    ]);
  }

  getProvider(role: 'default' | 'fallback'): AIProvider {
    const name = role === 'default'
      ? (process.env.AI_DEFAULT_PROVIDER ?? 'deepseek')
      : (process.env.AI_FALLBACK_PROVIDER ?? 'openai');
    return this.providers.get(name) ?? this.providers.get('deepseek')!;
  }

  async generateWithFallback(request: GenerateRequest): Promise<GenerateResponse> {
    const primary = this.getProvider('default');
    try {
      return await primary.generate(request);
    } catch (err) {
      console.error(`[AI] ${primary.name} failed, falling back:`, err);
      return await this.getProvider('fallback').generate(request);
    }
  }
}

export const providerManager = new AIProviderManager();
