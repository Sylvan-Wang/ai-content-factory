import type { RecognitionResult, RecognitionDecision } from './types';

export function handleConfidence(result: RecognitionResult): RecognitionDecision {
  const high = parseFloat(process.env.VISION_HIGH_CONFIDENCE_THRESHOLD ?? '0.80');
  const low  = parseFloat(process.env.VISION_LOW_CONFIDENCE_THRESHOLD  ?? '0.50');

  if (result.confidence >= high && result.categoryId) {
    return { action: 'auto_proceed', result };
  }
  if (result.confidence >= low && result.categoryId) {
    return { action: 'confirm_needed', result };
  }
  return { action: 'manual_select' };
}
