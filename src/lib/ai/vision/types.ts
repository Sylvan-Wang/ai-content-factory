export interface VisionProvider {
  name: string;
  recognizeProduct(imageBase64: string, categoryIds: string[]): Promise<RecognitionResult>;
}

export interface RecognitionResult {
  categoryId: string | null;
  productName: string | null;
  confidence: number;
  rawLabel: string;
}

export type RecognitionDecision =
  | { action: 'auto_proceed'; result: RecognitionResult }
  | { action: 'confirm_needed'; result: RecognitionResult }
  | { action: 'manual_select' };
