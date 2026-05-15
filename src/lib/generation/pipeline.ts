import { supabaseAdmin } from '../supabase';
import { providerManager } from '../ai/provider-manager';
import { buildGenerationPrompt } from '../prompt/prompt-builder';
import { getViralReferencesForPrompt } from '../references/reference-retriever';
import { selectPersonaAndScene } from './persona-scene-selector';
import { flagComplianceIssues } from '../compliance/checker';
import type { CategoryConfig, ContentVersion, ContentVersionWithFlags, GenerationInput, GenerationOutput } from '../ai/types';

const categoryCache = new Map<string, { data: CategoryConfig; expiry: number }>();

export async function getCategoryConfig(id: string): Promise<CategoryConfig> {
  const cached = categoryCache.get(id);
  if (cached && Date.now() < cached.expiry) return cached.data;

  const { data, error } = await supabaseAdmin
    .from('category_configs').select('*').eq('id', id).eq('enabled', true).single();

  if (error || !data) throw new Error(`Category not found: ${id}`);

  const config = mapCategoryRow(data);
  categoryCache.set(id, { data: config, expiry: Date.now() + 5 * 60 * 1000 });
  return config;
}

export async function getAllCategories(): Promise<CategoryConfig[]> {
  const { data, error } = await supabaseAdmin
    .from('category_configs').select('id, name, group_name, icon, enabled, sort_order')
    .eq('enabled', true).order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data.map(mapCategoryRow);
}

export async function generateContent(input: GenerationInput): Promise<GenerationOutput> {
  const category = await getCategoryConfig(input.categoryId);

  const references = await getViralReferencesForPrompt(input.categoryId, input.lastHookType, 3);
  const hookTypeUsed = references[0]?.hookType ?? 'lifestyle';

  const { persona, scene, templateType } = selectPersonaAndScene(category, input.product, input.sessionHistory);

  const { systemPrompt, userPrompt } = buildGenerationPrompt(
    category, persona, scene, templateType, references, input.product, input.storeName,
  );

  const aiResponse = await providerManager.generateWithFallback({
    systemPrompt, userPrompt, maxTokens: 900, temperature: 0.85,
  });

  const content = parseGenerationOutput(aiResponse.content);
  const flaggedContent: ContentVersionWithFlags = await flagComplianceIssues(content);

  const logId = await logGeneration({
    sessionId: input.sessionId, categoryId: input.categoryId, storeName: input.storeName,
    productName: input.product.name, productPrice: input.product.price, productHighlights: input.product.highlights,
    recognitionCategoryId: input.recognitionCategoryId, recognitionConfidence: input.recognitionConfidence,
    wasRecognitionCorrected: input.wasRecognitionCorrected, aiProvider: aiResponse.provider,
    aiModel: aiResponse.model, hookTypeUsed, templateTypeUsed: templateType, personaUsed: persona, sceneUsed: scene,
    promptTokens: aiResponse.usage.promptTokens, completionTokens: aiResponse.usage.completionTokens,
    latencyMs: aiResponse.latencyMs, generatedContent: flaggedContent, parseError: flaggedContent.parseError ?? false,
  });

  return {
    generationId: logId, content: flaggedContent, hookTypeUsed, templateTypeUsed: templateType,
    personaUsed: persona, sceneUsed: scene,
    metadata: { provider: aiResponse.provider, model: aiResponse.model, latencyMs: aiResponse.latencyMs },
  };
}

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : '{}';
}

function parseGenerationOutput(raw: string): ContentVersion {
  try {
    const json = JSON.parse(extractJSON(raw));
    return {
      title: String(json.title ?? ''),
      coverTextOptions: Array.isArray(json.coverTextOptions) ? json.coverTextOptions : [],
      body: String(json.body ?? ''),
      tags: Array.isArray(json.tags) ? json.tags : [],
    };
  } catch {
    return { title: '', coverTextOptions: [], body: raw, tags: [], parseError: true };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logGeneration(data: any): Promise<string> {
  const { data: row, error } = await supabaseAdmin
    .from('generation_logs')
    .insert({
      session_id: data.sessionId, category_id: data.categoryId, store_name: data.storeName,
      product_name: data.productName, product_price: data.productPrice, product_highlights: data.productHighlights,
      recognition_category_id: data.recognitionCategoryId, recognition_confidence: data.recognitionConfidence,
      was_recognition_corrected: data.wasRecognitionCorrected ?? false, ai_provider: data.aiProvider,
      ai_model: data.aiModel, hook_type_used: data.hookTypeUsed, template_type_used: data.templateTypeUsed,
      persona_used: data.personaUsed, scene_used: data.sceneUsed, prompt_tokens: data.promptTokens,
      completion_tokens: data.completionTokens, latency_ms: data.latencyMs,
      generated_content: data.generatedContent, parse_error: data.parseError,
    })
    .select('id').single();

  if (error) { console.error('[Pipeline] Failed to log generation:', error); return 'no-log-id'; }
  return row.id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategoryRow(row: any): CategoryConfig {
  return {
    id: row.id, name: row.name, groupName: row.group_name, icon: row.icon ?? '💊',
    tonePreference: row.tone_preference ?? '', sellingPoints: row.selling_points ?? [],
    avoidExpressions: row.avoid_expressions ?? [], xiaohongshuTags: row.xiaohongshu_tags ?? [],
    visionKeywords: row.vision_keywords ?? [],
    personas: row.personas ?? { core: ['日常用户'], related: [], broad: [] },
    scenes: row.scenes ?? ['日常使用'],
    painPoints: row.pain_points ?? { bodyFeel: [], lifeProblem: [], emotion: [], decision: [] },
    sellingPointTranslations: row.selling_point_translations ?? [],
    ctaTemplates: row.cta_templates ?? { xiaohongshu: '欢迎来门店了解', wechat_moments: '', private_group: '' },
    preferredTemplates: row.preferred_templates ?? ['pain_reminder', 'staff_experience'],
  };
}
