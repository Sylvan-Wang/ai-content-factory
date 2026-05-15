import { supabaseAdmin } from '../supabase';
import type { ViralReference } from '../ai/types';

export async function getViralReferencesForPrompt(categoryId: string, lastHookType?: string, limit = 3): Promise<ViralReference[]> {
  const { data, error } = await supabaseAdmin
    .from('viral_references')
    .select('*')
    .eq('category_id', categoryId)
    .eq('enabled', true)
    .order('quality_score', { ascending: false });

  if (error || !data || data.length === 0) return [];

  const byHookType: Record<string, ViralReference[]> = {};
  for (const ref of data) {
    const key = ref.hook_type ?? 'lifestyle';
    if (!byHookType[key]) byHookType[key] = [];
    byHookType[key].push(mapRow(ref));
  }

  const hookTypes = Object.keys(byHookType);
  const prioritized = lastHookType
    ? [...hookTypes.filter(h => h !== lastHookType), lastHookType]
    : hookTypes;

  const selected: ViralReference[] = [];
  for (const ht of prioritized) {
    if (selected.length >= limit) break;
    const group = byHookType[ht] ?? [];
    if (group.length > 0) selected.push(weightedRandom(group));
  }
  return selected.slice(0, limit);
}

function weightedRandom(items: ViralReference[]): ViralReference {
  const total = items.reduce((s, r) => s + r.qualityScore, 0);
  let rand = Math.random() * total;
  for (const item of items) { rand -= item.qualityScore; if (rand <= 0) return item; }
  return items[items.length - 1];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): ViralReference {
  return {
    id: row.id, categoryId: row.category_id, platform: row.platform,
    targetPersona: row.target_persona, usageScene: row.usage_scene,
    painPointType: row.pain_point_type, painPointDescription: row.pain_point_description,
    hookType: row.hook_type ?? 'lifestyle', openerPattern: row.opener_pattern,
    structure: row.structure, toneNotes: row.tone_notes, ctaType: row.cta_type,
    complianceNotes: row.compliance_notes, qualityScore: row.quality_score ?? 3,
  };
}
