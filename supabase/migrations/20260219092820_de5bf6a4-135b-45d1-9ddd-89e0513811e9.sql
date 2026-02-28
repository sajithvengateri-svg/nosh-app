
-- Landing sections table for admin-controlled landing page
CREATE TABLE public.landing_sections (
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

ALTER TABLE public.landing_sections ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public landing page)
CREATE POLICY "Anyone can read landing sections"
  ON public.landing_sections FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert landing sections"
  ON public.landing_sections FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update landing sections"
  ON public.landing_sections FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete landing sections"
  ON public.landing_sections FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Timestamp trigger
CREATE TRIGGER update_landing_sections_updated_at
  BEFORE UPDATE ON public.landing_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default sections
INSERT INTO public.landing_sections (section_key, title, subtitle, is_visible, content, sort_order) VALUES
  ('hero', 'The Operating System for Professional Kitchens', 'Recipe costing, prep lists, inventory, food safety — all in one place. Built by chefs, for chefs.', true, '[]', 0),
  ('features', 'Everything Your Kitchen Needs', '', true, '[]', 1),
  ('social_proof', '', 'Built for professional kitchens · Trusted by head chefs across Australia', true, '[]', 2),
  ('highlights', 'Platform Highlights', 'See what ChefOS can do for your kitchen', true, '[{"title":"Recipe Costing","description":"Instantly calculate food costs per dish and per portion. Track price changes from suppliers and see real-time impact on your margins.","icon":"DollarSign"},{"title":"Smart Prep Lists","description":"Auto-generated prep lists based on pars, bookings and forecasts. Never over-prep or run short again.","icon":"ClipboardList"},{"title":"Inventory Alerts","description":"Live stock levels, waste tracking and low-stock alerts. Know exactly what you have and what you need to order.","icon":"Package"}]', 3),
  ('testimonials', 'What Chefs Are Saying', 'Hear from kitchens already using ChefOS', true, '[]', 4),
  ('footer', '', '', true, '[]', 5);
