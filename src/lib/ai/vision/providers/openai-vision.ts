import OpenAI from 'openai';
import type { VisionProvider, RecognitionResult } from '../types';

export class OpenAIVisionProvider implements VisionProvider {
  name = 'openai-vision';
  private client: OpenAI;
  private model: string;

  constructor() {
    const hasOpenAI = !!process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== 'sk-xxxxxxxx';

    if (hasOpenAI) {
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
      this.model = process.env.OPENAI_VISION_MODEL ?? 'gpt-4o-mini';
    } else {
      this.client = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY?? 'placeholder',
        baseURL: 'https://api.deepseek.com',
      });
      this.model = 'deepseek-chat';
    }
  }

  async recognizeProduct(imageBase64: string, categoryIds: string[]): Promise<RecognitionResult> {
    const prompt = `请识别这张图片中的健康/保健品商品。

返回 JSON 格式（只返回 JSON，不要其他文字）：
{
  "categoryId": "从以下品类ID列表中选一个最匹配的，如果都不匹配返回null",
  "productName": "商品的具体名称，如果识别不清返回null",
  "confidence": 0到1之间的数字，代表你对识别结果的把握程度,
  "rawLabel": "你识别到的商品简要描述"
}

可用品类 ID 列表：
${categoryIds.join(', ')}

confidence 评分标准：
- 0.9+：包装清晰，品类非常确定
- 0.7-0.9：能判断品类，但不完全确定
- 0.5-0.7：猜测性质，需要用户确认
- 0.5以下：无法判断`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'low' } },
          ],
        }],
        max_tokens: 200,
      });
      const raw = response.choices[0].message.content ?? '{}';
      return parseRecognitionResponse(raw);
    } catch (err) {
      console.error('[Vision] recognition failed:', err);
      return { categoryId: null, productName: null, confidence: 0, rawLabel: 'recognition_failed' };
    }
  }
}

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : '{}';
}

function parseRecognitionResponse(raw: string): RecognitionResult {
  try {
    const json = JSON.parse(extractJSON(raw));
    return {
      categoryId: typeof json.categoryId === 'string' ? json.categoryId : null,
      productName: typeof json.productName === 'string' ? json.productName : null,
      confidence: Math.min(1, Math.max(0, Number(json.confidence) || 0)),
      rawLabel: typeof json.rawLabel === 'string' ? json.rawLabel : raw,
    };
  } catch {
    return { categoryId: null, productName: null, confidence: 0, rawLabel: raw };
  }
}
