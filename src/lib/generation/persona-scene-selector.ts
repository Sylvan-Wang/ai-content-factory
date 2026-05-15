import type { CategoryConfig, ContentTemplateType, ProductInput } from '../ai/types';

interface SelectionResult {
  persona: string;
  scene: string;
  templateType: ContentTemplateType;
}

interface HistoryEntry {
  templateTypeUsed?: string;
}

export function selectPersonaAndScene(
  category: CategoryConfig,
  _product: ProductInput,
  sessionHistory?: HistoryEntry[],
): SelectionResult {
  const corePersonas = category.personas?.core ?? ['日常用户'];
  const personaIdx = (sessionHistory?.length ?? 0) % corePersonas.length;
  const persona = corePersonas[personaIdx];

  const scenes = category.scenes ?? ['日常使用'];
  const scenePool = scenes.slice(0, Math.min(3, scenes.length));
  const scene = scenePool[Math.floor(Math.random() * scenePool.length)];

  const preferred = (category.preferredTemplates?.length > 0)
    ? category.preferredTemplates
    : (['pain_reminder', 'staff_experience'] as ContentTemplateType[]);
  const lastTemplate = sessionHistory?.[sessionHistory.length - 1]?.templateTypeUsed as ContentTemplateType | undefined;
  const available = preferred.filter(t => t !== lastTemplate);
  const templateType = (available[0] ?? preferred[0]) as ContentTemplateType;

  return { persona, scene, templateType };
}
