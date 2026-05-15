export interface AIProvider {
  name: string;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  stream(request: GenerateRequest): AsyncIterable<string>;
}

export interface GenerateRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResponse {
  content: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  model: string;
  provider: string;
  latencyMs: number;
}

export interface CategoryConfig {
  id: string;
  name: string;
  groupName: string;
  icon: string;
  tonePreference: string;
  sellingPoints: string[];
  avoidExpressions: string[];
  xiaohongshuTags: string[];
  visionKeywords: string[];
  personas: { core: string[]; related: string[]; broad: string[] };
  scenes: string[];
  painPoints: { bodyFeel: string[]; lifeProblem: string[]; emotion: string[]; decision: string[] };
  sellingPointTranslations: Array<{ original: string; translated: string }>;
  ctaTemplates: { xiaohongshu: string; wechat_moments: string; private_group: string };
  preferredTemplates: ContentTemplateType[];
}

export interface ProductInput {
  name?: string;
  price?: string;
  highlights?: string;
}

export type ContentTemplateType =
  | 'pain_reminder'
  | 'list_recommend'
  | 'avoid_trap'
  | 'staff_experience'
  | 'scene_video';

export interface ContentVersion {
  title: string;
  coverTextOptions: string[];
  body: string;
  tags: string[];
  parseError?: boolean;
}

export interface ContentVersionWithFlags extends ContentVersion {
  complianceFlags: ComplianceFlag[];
}

export interface ComplianceFlag {
  word: string;
  category: string;
  severity: 'warning' | 'risk';
  positions: number[];
}

export interface ViralReference {
  id: string;
  categoryId: string;
  platform: string;
  targetPersona?: string;
  usageScene?: string;
  painPointType?: string;
  painPointDescription?: string;
  hookType: string;
  openerPattern?: string;
  structure: string;
  toneNotes?: string;
  ctaType?: string;
  complianceNotes?: string;
  qualityScore: number;
}

export interface GenerationInput {
  sessionId: string;
  categoryId: string;
  product: ProductInput;
  storeName?: string;
  lastHookType?: string;
  lastTemplateType?: ContentTemplateType;
  recognitionCategoryId?: string;
  recognitionConfidence?: number;
  wasRecognitionCorrected?: boolean;
  sessionHistory?: Array<{ templateTypeUsed?: string }>;
}

export interface GenerationOutput {
  generationId: string;
  content: ContentVersionWithFlags;
  hookTypeUsed: string;
  templateTypeUsed: ContentTemplateType;
  personaUsed: string;
  sceneUsed: string;
  metadata: { provider: string; model: string; latencyMs: number };
}
