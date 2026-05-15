-- P0 种子数据：维生素C

INSERT INTO category_configs (
  id, name, group_name, icon, sort_order,
  tone_preference, selling_points, avoid_expressions, xiaohongshu_tags, vision_keywords,
  personas, scenes, pain_points, selling_point_translations, cta_templates, preferred_templates
) VALUES (
  'vit_c', '维生素 C', '保健营养品', '🍊', 1,
  '温柔种草风格，像闺蜜推荐，有生活感',
  '["熬夜族日常补充、提升活力","皮肤状态改善、气色更好","便携装设计、出门随手带","口感好（咀嚼/泡腾形式）","性价比高、长期服用无负担"]',
  '["美白","预防感冒","每天1000mg","治疗","疾病","绝对","最好","第一"]',
  '["#维生素C","#VC补充剂","#每日营养","#好物推荐","#养生打卡"]',
  '["维生素C","Vitamin C","VC","维C","抗坏血酸","维生素c"]',
  '{"core":["经常熬夜的上班族","换季皮肤暗沉的人","日常亚健康人群"],"related":["经常外卖的年轻人","宝妈"],"broad":["养生爱好者","精致生活追求者"]}',
  '["熬夜后第二天早上","换季感觉身体疲惫时","出差旅行随身携带","办公室放一瓶日常补充","长期压力大睡眠不规律"]',
  '{"bodyFeel":["熬夜后脸色暗黄","换季感觉没精神","皮肤干燥暗沉"],"lifeProblem":["每天外卖饮食不均衡","没时间买水果补充","补充剂太大颗难以下咽"],"emotion":["担心长期熬夜影响健康","觉得自己亚健康但不想吃药"],"decision":["不知道哪款VC吸收率好","不知道泡腾还是咀嚼哪个好"]}',
  '[{"original":"便携装","translated":"随手放包里，出门不忘带"},{"original":"咀嚼片","translated":"嚼一颗就好，不用喝大量水"},{"original":"泡腾片","translated":"放进水里嘶嘶冒泡，看着就很治愈"},{"original":"缓释技术","translated":"一整天慢慢吸收，不是喝进去就冲掉"},{"original":"高含量","translated":"一片够一天，不用数来数去"}]',
  '{"xiaohongshu":"路过门店可以来问问，我们有好几款可以试吃比较","wechat_moments":"门店有货，需要的私信我","private_group":"最近进了新款，有需要的来店里看看"}',
  '["pain_reminder","staff_experience","avoid_trap"]'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO viral_references (
  category_id, platform, target_persona, usage_scene, pain_point_type, pain_point_description,
  hook_type, opener_pattern, structure, tone_notes, cta_type, compliance_notes, quality_score, updated_by
) VALUES
(
  'vit_c', 'xiaohongshu', '经常熬夜的上班族', '每天早上上班前，作为日常习惯补充', 'emotion',
  '熬夜后担心身体透支，但又没时间认真养生', 'pain_point',
  '以"你有没有..."设问开头，精准描述目标用户的日常状态',
  '开头：以设问句切入熬夜用户的日常状态 → 中段：以"朋友推荐给我"引出日常补充习惯，用第一人称描述感知，不列功效只讲感受 → 结尾：一句"现在已经是日常习惯了"收口',
  '温柔亲切，第一人称，像闺蜜聊天，无夸张感', 'store_visit',
  '不说"美白"、不说"预防感冒"、不提具体摄入量数字', 5, 'PM'
),
(
  'vit_c', 'xiaohongshu', '换季皮肤暗沉的人', '换季皮肤状态变差，想找日常补充方案', 'bodyFeel',
  '换季后皮肤发暗、气色差，但不确定是不是要买护肤品', 'contrast',
  '以"同事以为我做了什么，其实只是..."做反差对比，引发好奇',
  '开头：反差对比开头 → 中段：轻描淡写讲日常补充VC的习惯，用对比方式呈现前后变化（气色/精神状态），不说"美白"只说"感觉脸亮了一些" → 结尾：分享选购标准，推荐来门店试吃比较',
  '轻松俏皮，有点神秘感，读完觉得这个人很真实', 'store_visit',
  '避免"美白""淡斑"等功效词，用"感觉脸亮了一些"这类主观感受代替', 4, 'PM'
),
(
  'vit_c', 'xiaohongshu', '日常亚健康人群', '平时作息不规律，想找简单可坚持的补充方案', 'decision',
  '看到很多种VC不知道怎么选，泡腾片、咀嚼片、软胶囊差异搞不清楚', 'utility',
  '以"我踩过坑"开头，降低读者防御心，激发好奇心',
  '开头：以踩坑经历切入 → 中段：2-3个选购维度（口感适不适合自己、含量说明、好不好坚持），每个维度一句话，不提品牌，说标准 → 结尾：到店可以问店员帮你对比',
  '理性干货风，但带个人经历，不像百科文章，有温度', 'store_visit',
  '不提具体摄入量数字，不声称功效，只聊选购逻辑', 4, 'PM'
);

INSERT INTO compliance_words (word, category, severity) VALUES
('治疗', 'drug_law', 'risk'), ('治愈', 'drug_law', 'risk'), ('根治', 'drug_law', 'risk'),
('消除疾病', 'drug_law', 'risk'), ('缓解疾病', 'drug_law', 'risk'), ('代替药物', 'drug_law', 'risk'),
('不需要吃药', 'drug_law', 'risk'), ('临床证明', 'drug_law', 'risk'), ('无副作用', 'drug_law', 'risk'),
('零风险', 'drug_law', 'warning'), ('立刻见效', 'drug_law', 'warning'), ('适合所有人', 'drug_law', 'warning'),
('全国领先', 'platform', 'warning'), ('国家级', 'platform', 'warning'), ('唯一', 'platform', 'warning'),
('第一', 'platform', 'warning'), ('最好', 'platform', 'warning'), ('最高', 'platform', 'warning')
ON CONFLICT (word) DO NOTHING;
