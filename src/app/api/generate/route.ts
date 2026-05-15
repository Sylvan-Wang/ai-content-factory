import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/generation/pipeline';
import { trackEvent } from '@/lib/analytics/tracker';
import type { GenerationInput } from '@/lib/ai/types';
import { isMockMode, MOCK_GENERATION } from '@/lib/mock';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const entry = rateLimitMap.get(sessionId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + dayMs });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoryId, sessionId, product, storeName, lastHookType, lastTemplateType, recognitionCategoryId, recognitionConfidence, wasRecognitionCorrected, sessionHistory } = body;

    if (!categoryId || !sessionId) {
      return NextResponse.json({ error: 'categoryId and sessionId are required' }, { status: 400 });
    }
    if (!checkRateLimit(sessionId)) {
      return NextResponse.json({ error: '今天的生成次数已用完（20次/天），明天再来' }, { status: 429 });
    }

    await trackEvent('generate_clicked', { category_id: categoryId, has_product_info: !!product?.name }, sessionId);

    if (isMockMode()) {
      const mockOutput = { ...MOCK_GENERATION, id: 'mock-' + Date.now() };
      await trackEvent('generate_completed', { category_id: categoryId, hook_type: mockOutput.hookTypeUsed, template_type: mockOutput.templateTypeUsed, latency_ms: mockOutput.metadata.latencyMs, provider: 'mock', is_mock: true }, sessionId);
      return NextResponse.json(mockOutput);
    }

    const input: GenerationInput = { sessionId, categoryId, product: product ?? {}, storeName, lastHookType, lastTemplateType, recognitionCategoryId, recognitionConfidence, wasRecognitionCorrected, sessionHistory };

    let output;
    try {
      output = await generateContent(input);
    } catch (aiErr) {
      console.error('[generate] AI failed, falling back to mock:', aiErr);
      const mockOutput = { ...MOCK_GENERATION, id: 'mock-fallback-' + Date.now(), _fallback: true };
      await trackEvent('generate_fallback', { category_id: categoryId, error: String(aiErr) }, sessionId);
      return NextResponse.json(mockOutput);
    }

    await trackEvent('generate_completed', { category_id: categoryId, hook_type: output.hookTypeUsed, template_type: output.templateTypeUsed, latency_ms: output.metadata.latencyMs, provider: output.metadata.provider }, sessionId);
    return NextResponse.json(output);
  } catch (err) {
    console.error('[POST /api/generate]', err);
    return NextResponse.json({ error: '生成失败，请稍后重试', detail: String(err) }, { status: 500 });
  }
}
