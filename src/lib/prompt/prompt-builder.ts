import { GLOBAL_SYSTEM_PROMPT } from './global-prompt';
import type { CategoryConfig, ContentTemplateType, ProductInput, ViralReference } from '../ai/types';

const TEMPLATE_INSTRUCTIONS: Record<ContentTemplateType, string> = {
  pain_reminder: `用"痛点提醒型"结构生成内容：
① 开头：描述目标用户正在经历的具体问题/不适（1-2句，让用户感觉"就是在说我"）
② 中段：介绍解决思路和选择标准，是建议不是推销（2-3句）
③ 结尾：轻 CTA，到店/私信/评论区（1句）`,

  list_recommend: `用"清单推荐型"结构生成内容：
① 开头：定义一个具体场景（1句，如"旅行必备"、"换季要备的几样"）
② 中段：推荐3个方向/角度，每个一句解释解决什么问题
③ 结尾：收藏/到店查看（1句）`,

  avoid_trap: `用"避坑科普型"结构生成内容：
① 开头：指出一个常见误解或踩坑（以"很多人以为"或"不是所有XX都适合"开头）
② 中段：正确的选择逻辑，2-3个维度（不说品牌，说标准）
③ 结尾：不确定可以到店问（1句）
注意：不做医疗诊断，只做选购建议`,

  staff_experience: `用"店员经验型"结构生成内容：
① 开头：以"最近门店顾客常问"或"被问最多的一个问题"切入（1句）
② 中段：店员自己的判断逻辑，一般会先问顾客什么，不同情况怎么推荐（2-3句）
③ 结尾：欢迎来店咨询（1句）
语气：真实店员的第一人称，克制，不夸大`,

  scene_video: `生成短视频口播脚本（15秒），格式如下，不需要生成标题/封面/标签：
[开场3s] 场景痛点（一句话让人停下来）
[主体8s] 建议/商品介绍（2-3句，口语化）
[结尾4s] 门店 CTA（1句，轻转化）`,
};

export function buildGenerationPrompt(
  category: CategoryConfig,
  persona: string,
  scene: string,
  templateType: ContentTemplateType,
  references: ViralReference[],
  product: ProductInput,
  storeName?: string,
): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: buildSystemPrompt(category, persona, scene, templateType, references),
    userPrompt: buildUserPrompt(product, persona, scene, templateType, storeName),
  };
}

function buildSystemPrompt(category: CategoryConfig, persona: string, scene: string, templateType: ContentTemplateType, references: ViralReference[]): string {
  const translationsText = category.sellingPointTranslations.length > 0
    ? category.sellingPointTranslations.map(t => `  - "${t.original}" → "${t.translated}"`).join('\n')
    : '  （暂无，直接使用用户提供的卖点描述）';

  const referencesText = references.length > 0
    ? references.map((r, i) => `\n参考${i + 1}（${r.hookType}）：\n  开头模式：${r.openerPattern ?? '未指定'}\n  结构：${r.structure}\n  语气：${r.toneNotes ?? '未指定'}`).join('\n')
    : '  （暂无爆文参考，按模板自由发挥）';

  return `${GLOBAL_SYSTEM_PROMPT}

======= 本次生成配置 =======

【第二层：品类内容包】
品类：${category.name}
目标人群：${persona}
使用场景：${scene}

买点翻译（优先使用这些表达，不用原始参数词）：
${translationsText}

【第三层：内容模板】
${TEMPLATE_INSTRUCTIONS[templateType]}

【第四层：爆文参考结构（参考模式，不要复制原文）】
${referencesText}

【第六层：品类合规边界】
以下表达禁止使用：${category.avoidExpressions.join('、')}

【结尾 CTA 参考（小红书）】
${category.ctaTemplates?.xiaohongshu ?? '欢迎来门店了解'}`.trim();
}

function buildUserPrompt(product: ProductInput, persona: string, scene: string, templateType: ContentTemplateType, storeName?: string): string {
  const productInfo = product.name
    ? `商品：${product.name}${product.price ? `，参考价格约 ${product.price} 元` : ''}${product.highlights ? `\n用户补充卖点：${product.highlights}` : ''}`
    : '（用户未提供具体商品名，请用该品类的通用场景生成内容）';

  const storeInfo = storeName ? `门店名称：${storeName}（可自然融入内容，不要生硬插入）` : '';

  const outputFormat = templateType === 'scene_video'
    ? '请按上方口播脚本格式直接输出，不需要 JSON 格式。'
    : `请生成一篇小红书内容，严格按以下 JSON 格式输出（只输出 JSON，不要其他内容）：
{
  "title": "标题（25-30字，含1-2个emoji）",
  "coverTextOptions": ["封面文字方案1（8-10字）", "封面文字方案2（8-10字）"],
  "body": "正文（100-150字，自然分段，用\\n\\n分隔段落）",
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}`;

  return `${productInfo}\n${storeInfo}\n\n写作方向：\n- 目标人群：${persona}\n- 使用场景：${scene}\n\n${outputFormat}`.trim();
}
