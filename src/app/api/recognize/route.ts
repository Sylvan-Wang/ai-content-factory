import { NextRequest, NextResponse } from 'next/server';
import { OpenAIVisionProvider } from '@/lib/ai/vision/providers/openai-vision';

export const dynamic = 'force-dynamic';
import { handleConfidence } from '@/lib/ai/vision/confidence-handler';
import { getAllCategories } from '@/lib/generation/pipeline';
import { trackEvent } from '@/lib/analytics/tracker';
import { isMockMode, MOCK_RECOGNITION } from '@/lib/mock';

const visionProvider = new OpenAIVisionProvider();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, sessionId } = body as { imageBase64: string; sessionId: string };

    if (!imageBase64 || !sessionId) {
      return NextResponse.json({ error: 'imageBase64 and sessionId are required' }, { status: 400 });
    }

    if (isMockMode()) {
      await trackEvent('recognition_completed', { category_id: MOCK_RECOGNITION.categoryId, confidence: MOCK_RECOGNITION.confidence, decision: MOCK_RECOGNITION.decision, success: true, is_mock: true }, sessionId);
      return NextResponse.json(MOCK_RECOGNITION);
    }

    const categories = await getAllCategories();
    const categoryIds = categories.map(c => c.id);
    const result = await visionProvider.recognizeProduct(imageBase64, categoryIds);
    const decision = handleConfidence(result);
    const matchedCategory = result.categoryId ? categories.find(c => c.id === result.categoryId) : null;

    await trackEvent('recognition_completed', { category_id: result.categoryId, confidence: result.confidence, decision: decision.action, success: !!result.categoryId }, sessionId);

    return NextResponse.json({
      categoryId: result.categoryId,
      productName: result.productName,
      confidence: result.confidence,
      decision: decision.action,
      categoryName: matchedCategory?.name ?? null,
      categoryIcon: matchedCategory?.icon ?? null,
      rawLabel: result.rawLabel,
    });
  } catch (err) {
    console.error('[POST /api/recognize]', err);
    return NextResponse.json({ ...MOCK_RECOGNITION, _fallback: true });
  }
}
