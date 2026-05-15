export const MOCK_RECOGNITION = {
  categoryId: 'vit_c',
  categoryName: '维生素C',
  categoryIcon: '🍋',
  productName: '维生素C泡腾片',
  confidence: 0.92,
  decision: 'proceed',
  rawLabel: 'vitamin_c_effervescent',
};

export const MOCK_GENERATION = {
  id: 'mock-' + Math.random().toString(36).slice(2, 8),
  title: '维C泡腾片 ｜ 皮肤暗沉的"救星"来了🍋',
  body: `打工人必看‼️\n\n下午三点，困到眼皮打架，皮肤暗黄没气色……\n这种状态你有没有？\n\n我们药店最近新到的维C泡腾片，\n放进水里"嘶——"一声冒泡，\n橙子味扑鼻而来 🍊\n\n✅ 补充每日维C需求\n✅ 帮助胶原蛋白合成\n✅ 抗氧化，气色更好看\n\n一粒泡腾片，溶在水里喝，\n比吃药片好接受多了！\n\n有在用维C的宝子，\n评论区来聊聊你的感受👇`,
  tags: ['#维生素C', '#药店推荐', '#皮肤管理', '#健康生活', '#美白抗氧化'],
  coverText: '维C补满 气色在线 🍋',
  complianceFlags: [],
  hookTypeUsed: 'pain_point',
  templateTypeUsed: 'staff_experience',
  personaUsed: '城市打工族',
  sceneUsed: '下午疲惫时刻',
  metadata: {
    provider: 'mock',
    model: 'mock-v1',
    latencyMs: 120,
    isMock: true,
  },
};

export function isMockMode(): boolean {
  if (process.env.MOCK_MODE === 'true') return true;
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'sk-xxxxxxxx';
  const hasOpenAI = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-xxxxxxxx';
  return !hasDeepSeek && !hasOpenAI;
}
