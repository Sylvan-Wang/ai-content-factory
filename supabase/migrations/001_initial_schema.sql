-- AI 内容工厂：初始数据库迁移

CREATE TABLE IF NOT EXISTS category_configs (
  id                          TEXT PRIMARY KEY,
  name                        TEXT NOT NULL,
  group_name                  TEXT NOT NULL,
  icon                        TEXT DEFAULT '💊',
  tone_preference             TEXT,
  selling_points              JSONB NOT NULL DEFAULT '[]',
  avoid_expressions           JSONB NOT NULL DEFAULT '[]',
  xiaohongshu_tags            JSONB NOT NULL DEFAULT '[]',
  vision_keywords             JSONB NOT NULL DEFAULT '[]',
  personas                    JSONB NOT NULL DEFAULT '{"core":[],"related":[],"broad":[]}',
  scenes                      JSONB NOT NULL DEFAULT '[]',
  pain_points                 JSONB NOT NULL DEFAULT '{"bodyFeel":[],"lifeProblem":[],"emotion":[],"decision":[]}',
  selling_point_translations  JSONB NOT NULL DEFAULT '[]',
  cta_templates               JSONB NOT NULL DEFAULT '{}',
  preferred_templates         JSONB NOT NULL DEFAULT '[]',
  enabled                     BOOLEAN DEFAULT true,
  sort_order                  INTEGER DEFAULT 0,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS viral_references (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id           TEXT REFERENCES category_configs(id) ON DELETE CASCADE,
  platform              TEXT DEFAULT 'xiaohongshu',
  target_persona        TEXT,
  usage_scene           TEXT,
  pain_point_type       TEXT CHECK (pain_point_type IN ('bodyFeel','lifeProblem','emotion','decision')),
  pain_point_description TEXT,
  hook_type             TEXT CHECK (hook_type IN ('pain_point','curiosity','contrast','lifestyle','utility')),
  opener_pattern        TEXT,
  structure             TEXT NOT NULL,
  tone_notes            TEXT,
  cta_type              TEXT CHECK (cta_type IN ('store_visit','private_message','comment')),
  compliance_notes      TEXT,
  enabled               BOOLEAN DEFAULT true,
  quality_score         INTEGER DEFAULT 3 CHECK (quality_score BETWEEN 1 AND 5),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_by            TEXT
);

CREATE INDEX IF NOT EXISTS idx_viral_refs_category ON viral_references(category_id);
CREATE INDEX IF NOT EXISTS idx_viral_refs_hook_type ON viral_references(hook_type);

CREATE TABLE IF NOT EXISTS compliance_words (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word        TEXT NOT NULL UNIQUE,
  category    TEXT CHECK (category IN ('drug_law','platform','custom')),
  severity    TEXT CHECK (severity IN ('warning','risk')) DEFAULT 'warning',
  enabled     BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generation_logs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id                TEXT NOT NULL,
  store_name                TEXT,
  category_id               TEXT REFERENCES category_configs(id),
  recognition_category_id   TEXT,
  recognition_confidence    NUMERIC(4,3),
  was_recognition_corrected BOOLEAN DEFAULT false,
  product_name              TEXT,
  product_price             TEXT,
  product_highlights        TEXT,
  ai_provider               TEXT NOT NULL,
  ai_vision_provider        TEXT,
  ai_model                  TEXT NOT NULL,
  hook_type_used            TEXT,
  template_type_used        TEXT,
  persona_used              TEXT,
  scene_used                TEXT,
  prompt_tokens             INTEGER,
  completion_tokens         INTEGER,
  latency_ms                INTEGER,
  generated_content         JSONB,
  parse_error               BOOLEAN DEFAULT false,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gen_logs_session ON generation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_gen_logs_created ON generation_logs(created_at);

CREATE TABLE IF NOT EXISTS analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT NOT NULL,
  event       TEXT NOT NULL,
  properties  JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);

CREATE TABLE IF NOT EXISTS content_interactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        TEXT NOT NULL,
  generation_log_id UUID REFERENCES generation_logs(id),
  action            TEXT CHECK (action IN ('copy_all','copy_title','copy_body','copy_tags','edit','regenerate')),
  was_edited        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE VIEW v_weekly_copy_rate AS
SELECT
  DATE_TRUNC('week', ci.created_at) AS week,
  COUNT(DISTINCT gl.id) AS generations,
  COUNT(*) FILTER (WHERE ci.action = 'copy_all') AS copies,
  ROUND(COUNT(*) FILTER (WHERE ci.action = 'copy_all')::NUMERIC / NULLIF(COUNT(DISTINCT gl.id), 0) * 100, 1) AS copy_rate_pct
FROM content_interactions ci
JOIN generation_logs gl ON ci.generation_log_id = gl.id
GROUP BY 1 ORDER BY 1 DESC;
