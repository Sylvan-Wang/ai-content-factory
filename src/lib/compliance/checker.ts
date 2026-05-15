import { supabaseAdmin } from '../supabase';
import type { ContentVersion, ContentVersionWithFlags, ComplianceFlag } from '../ai/types';

let cachedWords: ComplianceWord[] = [];
let cacheExpiry = 0;

interface ComplianceWord {
  word: string;
  category: string;
  severity: 'warning' | 'risk';
}

async function getComplianceWords(): Promise<ComplianceWord[]> {
  if (Date.now() < cacheExpiry) return cachedWords;
  try {
    const { data } = await supabaseAdmin.from('compliance_words').select('word, category, severity').eq('enabled', true);
    cachedWords = (data ?? []) as ComplianceWord[];
    cacheExpiry = Date.now() + 10 * 60 * 1000;
  } catch {
    // return cached or empty
  }
  return cachedWords;
}

function findAllPositions(text: string, word: string): number[] {
  const positions: number[] = [];
  let idx = text.indexOf(word);
  while (idx !== -1) { positions.push(idx); idx = text.indexOf(word, idx + 1); }
  return positions;
}

export async function flagComplianceIssues(content: ContentVersion): Promise<ContentVersionWithFlags> {
  try {
    const words = await getComplianceWords();
    const allText = `${content.title} ${content.body}`;
    const flags: ComplianceFlag[] = words
      .filter(w => allText.includes(w.word))
      .map(w => ({ word: w.word, category: w.category, severity: w.severity, positions: findAllPositions(allText, w.word) }));
    return { ...content, complianceFlags: flags };
  } catch {
    return { ...content, complianceFlags: [] };
  }
}
