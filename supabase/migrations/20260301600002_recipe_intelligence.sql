-- Recipe Intelligence Brain — Sacred analysis + Learning knowledge base
-- Enhances the extraction pipeline so it learns what makes each dish special

-- ─── 1. Per-recipe sacred analysis ──────────────────────────────────────────

CREATE TABLE ds_recipe_sacred_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL UNIQUE REFERENCES ds_recipes(id) ON DELETE CASCADE,
  cuisine TEXT NOT NULL,

  -- Sacred elements (what makes this dish THIS dish)
  hero_ingredient TEXT,
  sacred_ingredients JSONB DEFAULT '[]',
  sacred_technique TEXT,
  sacred_flavour_profile TEXT,

  -- Flexible elements (can simplify, combine, or remove)
  flexible_ingredients JSONB DEFAULT '[]',
  simplification_opportunities TEXT[] DEFAULT '{}',

  -- NOSH adaptation metadata
  one_pot_feasible BOOLEAN DEFAULT true,
  side_tasks_needed TEXT[] DEFAULT '{}',
  original_ingredient_count INTEGER,
  compressed_ingredient_count INTEGER,
  original_step_count INTEGER,
  compressed_step_count INTEGER,

  -- Quality scoring
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  risks TEXT[] DEFAULT '{}',
  chef_approved BOOLEAN DEFAULT false,

  -- Adaptations made during extraction
  adaptations_made JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ds_sacred_analysis_cuisine ON ds_recipe_sacred_analysis(cuisine);
CREATE INDEX idx_ds_sacred_analysis_quality ON ds_recipe_sacred_analysis(quality_score DESC);

-- RLS: admin full access, public read for published recipes
ALTER TABLE ds_recipe_sacred_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sacred analysis public read" ON ds_recipe_sacred_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ds_recipes r
      WHERE r.id = recipe_id AND r.is_published = true
    )
  );

CREATE POLICY "Sacred analysis admin write" ON ds_recipe_sacred_analysis
  FOR ALL USING (ds_is_admin());

-- ─── 2. Per-cuisine knowledge base (the learning brain) ─────────────────────

CREATE TABLE ds_recipe_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuisine TEXT UNIQUE NOT NULL,

  -- Aggregate sacred patterns (learned from N recipes)
  common_sacred_ingredients JSONB DEFAULT '[]',
  common_sacred_techniques TEXT[] DEFAULT '{}',
  common_flavour_profiles TEXT[] DEFAULT '{}',
  typical_vessels TEXT[] DEFAULT '{}',
  typical_hero_ingredients TEXT[] DEFAULT '{}',

  -- Aggregate flexible patterns
  commonly_removed TEXT[] DEFAULT '{}',
  common_substitutions JSONB DEFAULT '[]',
  common_side_tasks TEXT[] DEFAULT '{}',

  -- Stats
  recipe_count INTEGER DEFAULT 0,
  avg_quality_score DECIMAL(5,2),
  last_learned_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ds_knowledge_base_count ON ds_recipe_knowledge_base(recipe_count DESC);

-- RLS: public read, admin write
ALTER TABLE ds_recipe_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Knowledge base public read" ON ds_recipe_knowledge_base
  FOR SELECT USING (true);

CREATE POLICY "Knowledge base admin write" ON ds_recipe_knowledge_base
  FOR ALL USING (ds_is_admin());

-- ─── 3. Extend existing tables ──────────────────────────────────────────────

-- One-line hook that makes you want to cook this
ALTER TABLE ds_recipes ADD COLUMN IF NOT EXISTS nosh_hook TEXT;

-- Mark which ingredients are sacred to the dish
ALTER TABLE ds_recipe_ingredients ADD COLUMN IF NOT EXISTS is_sacred BOOLEAN DEFAULT false;
