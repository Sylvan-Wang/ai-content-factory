import OpenAI from 'openai';
import type { AIProvider, GenerateRequest, GenerateResponse } from '../types';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? 'placeholder' });
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const start = Date.now();
    const res = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      max_tokens: request.maxTokens ?? 800,
      temperature: request.temperature ?? 0.8,
    });
    return {
      content: res.choices[0].message.content ?? '',
      usage: {
        promptTokens: res.usage?.prompt_tokens ?? 0,
        completionTokens: res.usage?.completion_tokens ?? 0,
        totalTokens: res.usage?.total_tokens ?? 0,
      },
      model: res.model,
      provider: 'openai',
      latencyMs: Date.now() - start,
    };
  }

  async *stream(request: GenerateRequest): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      stream: true,
      max_tokens: request.maxTokens ?? 800,
      temperature: request.temperature ?? 0.8,
    });
    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content ?? '';
    }
  }
}
