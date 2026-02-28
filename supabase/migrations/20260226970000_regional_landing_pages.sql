-- Regional landing pages: India Home Cook, India Food Safety, GCC Home Cook, GCC Food Safety
-- Same schema as other landing section tables

-- ============================================================
-- 1. India Home Cook Landing Sections
-- ============================================================
CREATE TABLE public.india_home_cook_landing_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  content jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.india_home_cook_landing_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read india home cook landing sections"
  ON public.india_home_cook_landing_sections FOR SELECT USING (true);
CREATE POLICY "Admins can insert india home cook landing sections"
  ON public.india_home_cook_landing_sections FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update india home cook landing sections"
  ON public.india_home_cook_landing_sections FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete india home cook landing sections"
  ON public.india_home_cook_landing_sections FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

INSERT INTO public.india_home_cook_landing_sections (section_key, title, subtitle, is_visible, content, sort_order) VALUES
  ('hero', 'Your Indian Kitchen, Organised', 'From dal to biryani — manage recipes, track your pantry, reduce waste and cook smarter. Built for the Indian home cook.', true, '{"badge": "Made for India 🇮🇳", "cta_text": "Start Cooking Smarter", "cta_subtext": "Free forever · No credit card needed"}'::jsonb, 0),
  ('features', 'Everything Your Kitchen Needs', 'Pro tools made simple for your home kitchen.', true, '[
    {"icon": "ChefHat", "title": "Recipe Manager", "desc": "Store family recipes, scale servings instantly. From roti to rasam — all in one place."},
    {"icon": "Package", "title": "Smart Pantry", "desc": "Track your masalas, dal, rice and more. Know what you have before you shop."},
    {"icon": "Trash2", "title": "Waste Tracker", "desc": "Log food waste and see patterns. Save money and reduce your kitchen footprint."},
    {"icon": "Shield", "title": "Food Safety Tips", "desc": "Storage guides, expiry reminders, and safe handling for Indian ingredients."},
    {"icon": "BookOpen", "title": "Meal Planner", "desc": "Plan your weekly thali — breakfast, lunch, dinner with smart suggestions."},
    {"icon": "Store", "title": "Shopping Lists", "desc": "Auto-generate lists from your meal plan. Never forget the hing or curry leaves again."}
  ]'::jsonb, 1),
  ('coming_soon', 'Coming Soon', 'Even more ways to love your kitchen.', true, '[
    {"icon": "Share2", "title": "Recipe Sharing", "desc": "Share your signature biryani or chutney recipe with family and friends."},
    {"icon": "Users2", "title": "Family Kitchens", "desc": "Collaborate with family members on meal plans and shopping lists."},
    {"icon": "Heart", "title": "Festive Menus", "desc": "Diwali, Eid, Pongal — pre-built festive meal planners for every celebration."}
  ]'::jsonb, 2),
  ('money_tracker', 'Track Your Kitchen Spend', 'Simple expense tracking in INR — see where your grocery budget goes.', true, '{"metrics": ["Monthly Spend", "Savings", "Waste Cost", "Per Meal"]}'::jsonb, 3),
  ('solo_team', 'Solo Cook or Family Kitchen', 'Whether you cook alone or with the whole family — ChefOS Home adapts to your style.', true, '{}'::jsonb, 4),
  ('themes', 'Make It Yours', 'Choose a theme that matches your kitchen vibe.', true, '[
    {"name": "Saffron", "colors": ["#F59E0B", "#D97706", "#92400E"]},
    {"name": "Mint", "colors": ["#10B981", "#059669", "#047857"]},
    {"name": "Rose", "colors": ["#F472B6", "#EC4899", "#DB2777"]},
    {"name": "Midnight", "colors": ["#1E293B", "#0F172A", "#020617"]}
  ]'::jsonb, 5),
  ('final_cta', 'Ready to Organise Your Kitchen?', 'Join thousands of home cooks across India making meal time easier.', true, '{"button_text": "Get Started Free"}'::jsonb, 6);

-- ============================================================
-- 2. India Food Safety Landing Sections
-- ============================================================
CREATE TABLE public.india_food_safety_landing_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  content jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.india_food_safety_landing_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read india food safety landing sections"
  ON public.india_food_safety_landing_sections FOR SELECT USING (true);
CREATE POLICY "Admins can insert india food safety landing sections"
  ON public.india_food_safety_landing_sections FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update india food safety landing sections"
  ON public.india_food_safety_landing_sections FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete india food safety landing sections"
  ON public.india_food_safety_landing_sections FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

INSERT INTO public.india_food_safety_landing_sections (section_key, title, subtitle, is_visible, content, sort_order) VALUES
  ('hero', 'FSSAI Compliance, Simplified', 'Digital food safety management for Indian restaurants, cloud kitchens, and food businesses. Stay FSSAI-ready, always.', true, '{"badge": "Built for India 🇮🇳", "cta_text": "Start Free Trial", "cta_subtext": "No credit card required"}'::jsonb, 0),
  ('compliance_features', 'Complete Food Safety Toolkit', 'Everything you need to stay compliant and audit-ready under FSSAI regulations.', true, '[
    {"icon": "Shield", "title": "FSSAI Log Books", "desc": "Digital versions of all mandatory FSSAI record-keeping. Temperature logs, cleaning schedules, pest control records."},
    {"icon": "Thermometer", "title": "Temperature Monitoring", "desc": "Log fridge, freezer, and hot-hold temps. Get alerts when readings are out of range."},
    {"icon": "FileCheck", "title": "Hygiene Checklists", "desc": "Daily opening/closing checklists. Kitchen hygiene, personal hygiene, equipment sanitisation."},
    {"icon": "ClipboardList", "title": "Supplier Records", "desc": "Track supplier FSSAI licence numbers, delivery temps, and invoice records digitally."},
    {"icon": "AlertTriangle", "title": "Incident Reporting", "desc": "Log food safety incidents, corrective actions, and follow-ups in one place."},
    {"icon": "BarChart3", "title": "Compliance Dashboard", "desc": "See your compliance score at a glance. Know exactly where you stand before an audit."}
  ]'::jsonb, 1),
  ('fssai', 'FSSAI Compliance Made Easy', 'Whether you hold a basic registration or a state/central licence — ChefOS covers all FSSAI requirements.', true, '{"description": "From Schedule 4 hygiene standards to HACCP-based food safety management systems — we digitise the paperwork so you can focus on cooking. Track all mandatory records required under FSSAI Food Safety and Standards (Licensing and Registration of Food Businesses) Regulations.", "compliance_levels": ["Basic Registration", "State Licence", "Central Licence", "HACCP Certified"]}'::jsonb, 2),
  ('audit_readiness', 'Always Audit-Ready', 'No more last-minute panic before an FSSAI inspection.', true, '[
    {"title": "One-Click Audit Report", "desc": "Generate a complete compliance report with all logs, checklists, and records — ready for the Food Safety Officer."},
    {"title": "Missing Record Alerts", "desc": "Get notified when temperature logs or cleaning records are overdue. Never have gaps in your records."},
    {"title": "Staff Training Tracker", "desc": "Track food handler training certificates and renewal dates. FSSAI requires trained food handlers."},
    {"title": "Digital Record Keeping", "desc": "All records stored securely for the mandatory 2-year retention period required by FSSAI."}
  ]'::jsonb, 3),
  ('pricing', 'Simple, Transparent Pricing', 'Plans that work for every food business in India.', true, '[
    {"name": "Starter", "price": "Free", "period": "", "features": ["1 outlet", "Basic checklists", "Temperature logs", "7-day history"], "cta": "Get Started", "popular": false},
    {"name": "Professional", "price": "₹1,999", "period": "/month", "features": ["Up to 3 outlets", "Full FSSAI log books", "Audit reports", "Staff training tracker", "Email support"], "cta": "Start Free Trial", "popular": true},
    {"name": "Enterprise", "price": "Custom", "period": "", "features": ["Unlimited outlets", "Multi-city management", "API access", "Dedicated support", "Custom integrations"], "cta": "Contact Sales", "popular": false}
  ]'::jsonb, 4),
  ('final_cta', 'Stay Compliant. Stay Confident.', 'Join food businesses across India using ChefOS for digital food safety compliance.', true, '{"button_text": "Start Free Trial", "button_link": "/auth?tab=signup&source=india_food_safety"}'::jsonb, 5);

-- ============================================================
-- 3. GCC Home Cook Landing Sections
-- ============================================================
CREATE TABLE public.gcc_home_cook_landing_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  content jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gcc_home_cook_landing_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read gcc home cook landing sections"
  ON public.gcc_home_cook_landing_sections FOR SELECT USING (true);
CREATE POLICY "Admins can insert gcc home cook landing sections"
  ON public.gcc_home_cook_landing_sections FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update gcc home cook landing sections"
  ON public.gcc_home_cook_landing_sections FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete gcc home cook landing sections"
  ON public.gcc_home_cook_landing_sections FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

INSERT INTO public.gcc_home_cook_landing_sections (section_key, title, subtitle, is_visible, content, sort_order) VALUES
  ('hero', 'Your Kitchen, Organised', 'From machboos to harees — manage recipes, track your pantry, reduce waste and cook smarter. Built for home cooks in the Gulf.', true, '{"badge": "Made for the Gulf 🇦🇪", "cta_text": "Start Cooking Smarter", "cta_subtext": "Free forever · No credit card needed"}'::jsonb, 0),
  ('features', 'Everything Your Kitchen Needs', 'Pro tools made simple for your home kitchen.', true, '[
    {"icon": "ChefHat", "title": "Recipe Manager", "desc": "Store family recipes, scale servings instantly. From machboos to luqaimat — all in one place."},
    {"icon": "Package", "title": "Smart Pantry", "desc": "Track your spices, rice, saffron and more. Know what you have before you shop."},
    {"icon": "Trash2", "title": "Waste Tracker", "desc": "Log food waste and see patterns. Save money and reduce your kitchen footprint."},
    {"icon": "Shield", "title": "Food Safety Tips", "desc": "Storage guides, expiry reminders, and safe handling — especially important in Gulf heat."},
    {"icon": "BookOpen", "title": "Meal Planner", "desc": "Plan your weekly meals — suhoor, iftar, family gatherings with smart suggestions."},
    {"icon": "Store", "title": "Shopping Lists", "desc": "Auto-generate lists from your meal plan. Never forget the cardamom or dried limes again."}
  ]'::jsonb, 1),
  ('coming_soon', 'Coming Soon', 'Even more ways to love your kitchen.', true, '[
    {"icon": "Share2", "title": "Recipe Sharing", "desc": "Share your signature machboos or kunafa recipe with family and friends."},
    {"icon": "Users2", "title": "Family Kitchens", "desc": "Collaborate with family members on meal plans and shopping lists."},
    {"icon": "Heart", "title": "Occasion Menus", "desc": "Ramadan, Eid, National Day — pre-built meal planners for every occasion."}
  ]'::jsonb, 2),
  ('money_tracker', 'Track Your Kitchen Spend', 'Simple expense tracking in AED — see where your grocery budget goes.', true, '{"metrics": ["Monthly Spend", "Savings", "Waste Cost", "Per Meal"]}'::jsonb, 3),
  ('solo_team', 'Solo Cook or Family Kitchen', 'Whether you cook alone or with the whole family — ChefOS Home adapts to your style.', true, '{}'::jsonb, 4),
  ('themes', 'Make It Yours', 'Choose a theme that matches your kitchen vibe.', true, '[
    {"name": "Desert Gold", "colors": ["#F59E0B", "#D97706", "#92400E"]},
    {"name": "Oasis", "colors": ["#10B981", "#059669", "#047857"]},
    {"name": "Rose", "colors": ["#F472B6", "#EC4899", "#DB2777"]},
    {"name": "Midnight", "colors": ["#1E293B", "#0F172A", "#020617"]}
  ]'::jsonb, 5),
  ('final_cta', 'Ready to Organise Your Kitchen?', 'Join home cooks across the Gulf making meal time easier.', true, '{"button_text": "Get Started Free"}'::jsonb, 6);

-- ============================================================
-- 4. GCC Food Safety Landing Sections
-- ============================================================
CREATE TABLE public.gcc_food_safety_landing_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  content jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gcc_food_safety_landing_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read gcc food safety landing sections"
  ON public.gcc_food_safety_landing_sections FOR SELECT USING (true);
CREATE POLICY "Admins can insert gcc food safety landing sections"
  ON public.gcc_food_safety_landing_sections FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update gcc food safety landing sections"
  ON public.gcc_food_safety_landing_sections FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete gcc food safety landing sections"
  ON public.gcc_food_safety_landing_sections FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

INSERT INTO public.gcc_food_safety_landing_sections (section_key, title, subtitle, is_visible, content, sort_order) VALUES
  ('hero', 'Food Safety Compliance for the Gulf', 'Digital food safety management for restaurants, hotels, and catering across the GCC. Dubai Municipality, SFDA, and Halal compliant.', true, '{"badge": "Built for the GCC 🇦🇪", "cta_text": "Start Free Trial", "cta_subtext": "No credit card required"}'::jsonb, 0),
  ('compliance_features', 'Complete Food Safety Toolkit', 'Everything you need to stay compliant and audit-ready across GCC food safety regulations.', true, '[
    {"icon": "Shield", "title": "Digital HACCP Plans", "desc": "Full HACCP documentation with hazard analysis, CCPs, and corrective actions — all digital."},
    {"icon": "Thermometer", "title": "Temperature Monitoring", "desc": "Log fridge, freezer, and hot-hold temps. Critical in Gulf heat — get alerts when readings drift."},
    {"icon": "FileCheck", "title": "Hygiene Checklists", "desc": "Daily opening/closing checklists. Kitchen hygiene, personal hygiene, equipment sanitisation."},
    {"icon": "ClipboardList", "title": "Supplier & Halal Records", "desc": "Track supplier certifications, Halal certificates, delivery temps, and traceability records."},
    {"icon": "AlertTriangle", "title": "Incident Reporting", "desc": "Log food safety incidents, corrective actions, and follow-ups. Full audit trail."},
    {"icon": "BarChart3", "title": "Compliance Dashboard", "desc": "See your compliance score at a glance. Know exactly where you stand before an inspection."}
  ]'::jsonb, 1),
  ('dubai_municipality', 'Dubai Municipality & SFDA Ready', 'Whether you operate in Dubai, Abu Dhabi, Saudi Arabia, or across the GCC — ChefOS covers your compliance needs.', true, '{"description": "From Dubai Municipality food safety requirements to SFDA regulations in Saudi Arabia — we digitise the paperwork so you can focus on operations. Track all mandatory records for Halal compliance, food handler certificates, and municipal food safety inspections.", "compliance_levels": ["Dubai Municipality", "Abu Dhabi (ADFCA)", "SFDA (Saudi)", "Bahrain MOH"]}'::jsonb, 2),
  ('audit_readiness', 'Always Inspection-Ready', 'No more last-minute panic before a municipality inspection.', true, '[
    {"title": "One-Click Audit Report", "desc": "Generate a complete compliance report with all logs, checklists, and records — ready for the inspector."},
    {"title": "Missing Record Alerts", "desc": "Get notified when temperature logs or cleaning records are overdue. Never have gaps in your records."},
    {"title": "Staff Training Tracker", "desc": "Track food handler training and health cards. Municipality requires trained and certified staff."},
    {"title": "Halal Compliance Records", "desc": "Maintain Halal certification records, supplier certificates, and ingredient traceability — all in one place."}
  ]'::jsonb, 3),
  ('pricing', 'Simple, Transparent Pricing', 'Plans that work for every food business in the Gulf.', true, '[
    {"name": "Starter", "price": "Free", "period": "", "features": ["1 outlet", "Basic checklists", "Temperature logs", "7-day history"], "cta": "Get Started", "popular": false},
    {"name": "Professional", "price": "AED 499", "period": "/month", "features": ["Up to 3 outlets", "Full HACCP system", "Audit reports", "Staff training tracker", "Email support"], "cta": "Start Free Trial", "popular": true},
    {"name": "Enterprise", "price": "Custom", "period": "", "features": ["Unlimited outlets", "Multi-emirate management", "API access", "Dedicated support", "Custom integrations"], "cta": "Contact Sales", "popular": false}
  ]'::jsonb, 4),
  ('final_cta', 'Stay Compliant. Stay Confident.', 'Join food businesses across the Gulf using ChefOS for digital food safety compliance.', true, '{"button_text": "Start Free Trial", "button_link": "/auth?tab=signup&source=gcc_food_safety"}'::jsonb, 5);
