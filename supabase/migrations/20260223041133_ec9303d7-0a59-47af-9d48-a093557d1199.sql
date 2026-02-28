
-- Home Cook landing page sections CMS table
CREATE TABLE public.home_cook_landing_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  content JSONB DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_cook_landing_sections ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public landing page)
CREATE POLICY "Anyone can read home cook landing sections"
  ON public.home_cook_landing_sections FOR SELECT
  USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage home cook landing sections"
  ON public.home_cook_landing_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_permissions
      WHERE user_id = auth.uid()
    )
  );

-- Seed default sections matching current HomeCookLanding.tsx
INSERT INTO public.home_cook_landing_sections (section_key, title, subtitle, is_visible, sort_order, content) VALUES
  ('hero', 'Your Home Kitchen, Organised.', 'Recipe costing, inventory tracking, and food safety — designed for home-based food businesses.', true, 1, '{"badge": "Built for Home Cooks", "cta_text": "Start Cooking Smarter", "cta_subtext": "Free to start · No credit card"}'),
  ('features', 'Everything you need', 'Simple tools for your home kitchen business', true, 2, '[{"icon": "ChefHat", "title": "Recipe Bank", "desc": "Cost every dish you make. Know your margins."}, {"icon": "Utensils", "title": "Ingredients + Yield", "desc": "Track what you buy and what''s actually usable."}, {"icon": "Package", "title": "Inventory", "desc": "Know what you have. Never overbuy again."}, {"icon": "Trash2", "title": "Waste Log", "desc": "Track what you toss. Reduce waste, save money."}, {"icon": "Shield", "title": "Food Safety Logs", "desc": "Stay compliant with temp checks and HACCP."}, {"icon": "BookOpen", "title": "Cheatsheets", "desc": "Quick cooking references at your fingertips."}]'),
  ('coming_soon', 'Coming Soon', 'We''re building more for the home cook community', true, 3, '[{"icon": "Store", "title": "Peer-to-Peer Marketplace", "desc": "Sell to other home cooks and small businesses."}, {"icon": "Share2", "title": "Social Integration", "desc": "Share your creations with the community."}, {"icon": "Users2", "title": "Community Recipes", "desc": "Discover and share recipes with fellow home cooks."}]'),
  ('money_tracker', 'Track your money', 'Simple cost tracking without the complexity. Enter your food costs, labour, and overheads — see your profit instantly.', true, 4, '{"metrics": ["Revenue", "Food Cost", "Labour", "Profit"]}'),
  ('solo_team', 'Start solo. Add helpers when you grow.', 'Running your kitchen alone? Great — ChefOS Home works perfectly for one. When you''re ready to bring on helpers, just flip the team toggle.', true, 5, '{}'),
  ('themes', 'Make it yours', 'Choose a theme that matches your vibe', true, 6, '[{"name": "Pink Onion", "colors": ["#e91e8c", "#f472b6", "#fce7f3"]}, {"name": "Rainbow", "colors": ["#ef4444", "#f59e0b", "#22c55e"]}, {"name": "Ocean", "colors": ["#0ea5e9", "#06b6d4", "#e0f2fe"]}, {"name": "Terminal", "colors": ["#22c55e", "#15803d", "#0a0a0a"]}, {"name": "Lavender", "colors": ["#a78bfa", "#8b5cf6", "#ede9fe"]}]'),
  ('final_cta', 'Ready to organise your kitchen?', 'Join home cooks who are running smarter kitchens.', true, 7, '{"button_text": "Get Started Free"}');
