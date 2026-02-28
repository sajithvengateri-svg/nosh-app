
-- is_bar_manager() helper function
CREATE OR REPLACE FUNCTION public.is_bar_manager(uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_memberships
    WHERE user_id = uid AND role IN ('bar_manager', 'owner', 'head_chef', 'admin') AND is_active = true
  );
$$;

-- TABLE 1: bev_products
CREATE TABLE public.bev_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name text NOT NULL, main_category text NOT NULL DEFAULT 'spirits', sub_category text, format text, bottle_size_ml numeric, purchase_price numeric NOT NULL DEFAULT 0, sell_price numeric NOT NULL DEFAULT 0, pour_size_ml numeric, pours_per_unit numeric, par_level numeric, is_coravin_eligible boolean NOT NULL DEFAULT false, abv numeric, speed_rail_position integer, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view bev products" ON public.bev_products FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Bar managers can manage bev products" ON public.bev_products FOR ALL USING (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

-- TABLE 2: bev_wine_details
CREATE TABLE public.bev_wine_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id uuid NOT NULL REFERENCES public.bev_products(id) ON DELETE CASCADE, vintage integer, producer text, region text, appellation text, varietal text, wine_type text NOT NULL DEFAULT 'red', drink_from integer, drink_to integer, bin_number text, cellar_location text, optimal_serve_temp_c numeric
);
ALTER TABLE public.bev_wine_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View wine details" ON public.bev_wine_details FOR SELECT USING (EXISTS (SELECT 1 FROM bev_products WHERE id = product_id AND org_id IN (SELECT get_user_org_ids(auth.uid()))));
CREATE POLICY "Manage wine details" ON public.bev_wine_details FOR ALL USING (is_bar_manager(auth.uid()) AND EXISTS (SELECT 1 FROM bev_products WHERE id = product_id AND org_id IN (SELECT get_user_org_ids(auth.uid())))) WITH CHECK (is_bar_manager(auth.uid()));

-- TABLE 3: bev_beer_details
CREATE TABLE public.bev_beer_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id uuid NOT NULL REFERENCES public.bev_products(id) ON DELETE CASCADE, beer_type text, format text NOT NULL DEFAULT 'draught', keg_size_litres numeric, tap_number integer, line_number integer, glycol_temp_c numeric, coupler_type text, gas_type text
);
ALTER TABLE public.bev_beer_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View beer details" ON public.bev_beer_details FOR SELECT USING (EXISTS (SELECT 1 FROM bev_products WHERE id = product_id AND org_id IN (SELECT get_user_org_ids(auth.uid()))));
CREATE POLICY "Manage beer details" ON public.bev_beer_details FOR ALL USING (is_bar_manager(auth.uid()) AND EXISTS (SELECT 1 FROM bev_products WHERE id = product_id AND org_id IN (SELECT get_user_org_ids(auth.uid())))) WITH CHECK (is_bar_manager(auth.uid()));

-- TABLE 4: bev_coffee_details
CREATE TABLE public.bev_coffee_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id uuid NOT NULL REFERENCES public.bev_products(id) ON DELETE CASCADE, roaster text, origin text, roast_date date, best_before date, dose_g numeric, yield_ml numeric, brew_ratio text, grind_setting text, method text, tea_type text, steep_temp_c numeric, steep_time_s numeric, tds_reading numeric
);
ALTER TABLE public.bev_coffee_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View coffee details" ON public.bev_coffee_details FOR SELECT USING (EXISTS (SELECT 1 FROM bev_products WHERE id = product_id AND org_id IN (SELECT get_user_org_ids(auth.uid()))));
CREATE POLICY "Manage coffee details" ON public.bev_coffee_details FOR ALL USING (is_bar_manager(auth.uid()) AND EXISTS (SELECT 1 FROM bev_products WHERE id = product_id AND org_id IN (SELECT get_user_org_ids(auth.uid())))) WITH CHECK (is_bar_manager(auth.uid()));

-- TABLE 5: bev_cellar
CREATE TABLE public.bev_cellar (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id uuid NOT NULL REFERENCES public.bev_products(id) ON DELETE CASCADE, quantity numeric NOT NULL DEFAULT 0, location text, batch_ref text, supplier text, received_date date, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_cellar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View cellar" ON public.bev_cellar FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Manage cellar" ON public.bev_cellar FOR ALL USING (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

-- TABLE 6: bev_open_bottles
CREATE TABLE public.bev_open_bottles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id uuid NOT NULL REFERENCES public.bev_products(id) ON DELETE CASCADE, opened_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz, remaining_ml numeric NOT NULL DEFAULT 0, is_coravin boolean NOT NULL DEFAULT false, coravin_gas_pours_remaining integer, opened_by uuid, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_open_bottles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View open bottles" ON public.bev_open_bottles FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Insert open bottles" ON public.bev_open_bottles FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Manage open bottles" ON public.bev_open_bottles FOR ALL USING (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));
ALTER PUBLICATION supabase_realtime ADD TABLE public.bev_open_bottles;

-- TABLE 7: bev_pour_events (INSERT-only)
CREATE TABLE public.bev_pour_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id uuid NOT NULL REFERENCES public.bev_products(id) ON DELETE CASCADE, quantity_ml numeric NOT NULL, cost_per_pour numeric NOT NULL DEFAULT 0, sell_price numeric NOT NULL DEFAULT 0, gp_per_pour numeric NOT NULL DEFAULT 0, is_coravin_pour boolean NOT NULL DEFAULT false, pour_type text NOT NULL DEFAULT 'standard', poured_by uuid, shift_date date NOT NULL DEFAULT CURRENT_DATE, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_pour_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View pour events" ON public.bev_pour_events FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Insert pour events" ON public.bev_pour_events FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
ALTER PUBLICATION supabase_realtime ADD TABLE public.bev_pour_events;

-- TABLE 8: bev_cocktail_specs
CREATE TABLE public.bev_cocktail_specs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name text NOT NULL, category text NOT NULL DEFAULT 'classic', method_steps jsonb NOT NULL DEFAULT '[]'::jsonb, glassware text, garnish text, ice_type text NOT NULL DEFAULT 'cubed', cost_price numeric NOT NULL DEFAULT 0, sell_price numeric NOT NULL DEFAULT 0, is_prebatch boolean NOT NULL DEFAULT false, batch_yield_ml numeric, difficulty_level integer NOT NULL DEFAULT 1, image_url text, flash_card_notes text, tasting_notes text, quiz_answers jsonb, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_cocktail_specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View cocktail specs" ON public.bev_cocktail_specs FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Manage cocktail specs" ON public.bev_cocktail_specs FOR ALL USING (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

-- TABLE 9: bev_cocktail_ingredients
CREATE TABLE public.bev_cocktail_ingredients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, spec_id uuid NOT NULL REFERENCES public.bev_cocktail_specs(id) ON DELETE CASCADE, product_id uuid REFERENCES public.bev_products(id) ON DELETE SET NULL, quantity_ml numeric NOT NULL DEFAULT 0, unit text NOT NULL DEFAULT 'ml', cost numeric NOT NULL DEFAULT 0, org_id uuid NOT NULL
);
ALTER TABLE public.bev_cocktail_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View cocktail ingredients" ON public.bev_cocktail_ingredients FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Manage cocktail ingredients" ON public.bev_cocktail_ingredients FOR ALL USING (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

-- TABLE 10: bev_prebatch_logs
CREATE TABLE public.bev_prebatch_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, spec_id uuid NOT NULL REFERENCES public.bev_cocktail_specs(id) ON DELETE CASCADE, volume_ml numeric NOT NULL, cost numeric NOT NULL DEFAULT 0, prepared_by uuid, expires_at timestamptz, batch_number text, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_prebatch_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View prebatch" ON public.bev_prebatch_logs FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Insert prebatch" ON public.bev_prebatch_logs FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));

-- TABLE 11: bev_keg_tracking
CREATE TABLE public.bev_keg_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id uuid NOT NULL REFERENCES public.bev_products(id) ON DELETE CASCADE, tap_number integer, tapped_at timestamptz NOT NULL DEFAULT now(), kicked_at timestamptz, theoretical_pours integer NOT NULL DEFAULT 0, actual_pours integer NOT NULL DEFAULT 0, yield_pct numeric, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_keg_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View kegs" ON public.bev_keg_tracking FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Manage kegs" ON public.bev_keg_tracking FOR ALL USING (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));
ALTER PUBLICATION supabase_realtime ADD TABLE public.bev_keg_tracking;

-- TABLE 12: bev_line_cleaning_log
CREATE TABLE public.bev_line_cleaning_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, line_number integer NOT NULL, cleaned_at timestamptz NOT NULL DEFAULT now(), cleaned_by uuid, next_due timestamptz, chemical_used text, org_id uuid NOT NULL
);
ALTER TABLE public.bev_line_cleaning_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View line cleaning" ON public.bev_line_cleaning_log FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Insert line cleaning" ON public.bev_line_cleaning_log FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Manage line cleaning" ON public.bev_line_cleaning_log FOR ALL USING (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

-- TABLE 13: bev_coffee_dialing
CREATE TABLE public.bev_coffee_dialing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id uuid NOT NULL REFERENCES public.bev_products(id) ON DELETE CASCADE, dose_g numeric NOT NULL, yield_ml numeric NOT NULL, time_s numeric NOT NULL, grinder_setting text, tds numeric, notes text, dialed_by uuid, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_coffee_dialing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View coffee dialing" ON public.bev_coffee_dialing FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Insert coffee dialing" ON public.bev_coffee_dialing FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));

-- TABLE 14: bev_waste_events (INSERT-only)
CREATE TABLE public.bev_waste_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id uuid NOT NULL REFERENCES public.bev_products(id) ON DELETE CASCADE, quantity_ml numeric NOT NULL, reason text NOT NULL DEFAULT 'breakage', cost numeric NOT NULL DEFAULT 0, reported_by uuid, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_waste_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View waste" ON public.bev_waste_events FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Insert waste" ON public.bev_waste_events FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));

-- TABLE 15: bev_bar_prep
CREATE TABLE public.bev_bar_prep (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name text NOT NULL, date date NOT NULL DEFAULT CURRENT_DATE, shift text NOT NULL DEFAULT 'am', items jsonb NOT NULL DEFAULT '[]'::jsonb, assigned_to uuid, status text NOT NULL DEFAULT 'pending', notes text, section_id uuid, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_bar_prep ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View bar prep" ON public.bev_bar_prep FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Manage bar prep" ON public.bev_bar_prep FOR ALL USING (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Assigned update bar prep" ON public.bev_bar_prep FOR UPDATE USING (auth.uid() = assigned_to);

-- TABLE 16: bev_stocktakes
CREATE TABLE public.bev_stocktakes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, date date NOT NULL DEFAULT CURRENT_DATE, status text NOT NULL DEFAULT 'in_progress', completed_by uuid, location text, count_type text NOT NULL DEFAULT 'full', notes text, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_stocktakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View stocktakes" ON public.bev_stocktakes FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Manage stocktakes" ON public.bev_stocktakes FOR ALL USING (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

-- TABLE 17: bev_stocktake_items
CREATE TABLE public.bev_stocktake_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, stocktake_id uuid NOT NULL REFERENCES public.bev_stocktakes(id) ON DELETE CASCADE, product_id uuid NOT NULL REFERENCES public.bev_products(id) ON DELETE CASCADE, expected_qty numeric NOT NULL DEFAULT 0, counted_qty numeric NOT NULL DEFAULT 0, variance numeric NOT NULL DEFAULT 0, variance_cost numeric NOT NULL DEFAULT 0, location text, org_id uuid NOT NULL
);
ALTER TABLE public.bev_stocktake_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View stocktake items" ON public.bev_stocktake_items FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Manage stocktake items" ON public.bev_stocktake_items FOR ALL USING (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

-- TABLE 18: bev_coravin_capsules
CREATE TABLE public.bev_coravin_capsules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, capsule_type text NOT NULL DEFAULT 'standard', quantity_in_stock integer NOT NULL DEFAULT 0, pours_per_capsule integer NOT NULL DEFAULT 15, cost_per_capsule numeric NOT NULL DEFAULT 0, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_coravin_capsules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View coravin" ON public.bev_coravin_capsules FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Manage coravin" ON public.bev_coravin_capsules FOR ALL USING (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

-- TABLE 19: bev_flash_cards
CREATE TABLE public.bev_flash_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, title text NOT NULL, category text NOT NULL DEFAULT 'cocktails', content text NOT NULL DEFAULT '', image_url text, quiz_question text, quiz_answers jsonb, difficulty_level integer NOT NULL DEFAULT 1, org_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_flash_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View flash cards" ON public.bev_flash_cards FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Manage flash cards" ON public.bev_flash_cards FOR ALL USING (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (is_bar_manager(auth.uid()) AND org_id IN (SELECT get_user_org_ids(auth.uid())));

-- TABLE 20: bev_demand_insights
CREATE TABLE public.bev_demand_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_category text NOT NULL, product_name text, postcode text NOT NULL, week_ending date NOT NULL, order_count integer NOT NULL DEFAULT 0, total_quantity numeric NOT NULL DEFAULT 0, avg_price_paid numeric, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_demand_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View bev demand" ON public.bev_demand_insights FOR SELECT USING (auth.uid() IS NOT NULL);

-- STAGE 7: Vendor tagging
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendor_profiles' AND column_name = 'vendor_type') THEN
      ALTER TABLE public.vendor_profiles ADD COLUMN vendor_type text NOT NULL DEFAULT 'food';
    END IF;
  END IF;
END $$;

CREATE TABLE public.bev_vendor_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, vendor_id uuid NOT NULL, product_name text NOT NULL, category text NOT NULL, sub_category text, region text, producer text, vintage integer, format text, price_per_unit numeric NOT NULL DEFAULT 0, min_order_qty integer NOT NULL DEFAULT 1, is_available boolean NOT NULL DEFAULT true, lead_time_days integer, valid_from date, valid_until date, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_vendor_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View bev vendor pricing" ON public.bev_vendor_pricing FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Vendors manage own pricing" ON public.bev_vendor_pricing FOR ALL USING (vendor_id = auth.uid()) WITH CHECK (vendor_id = auth.uid());

CREATE TABLE public.bev_vendor_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, vendor_id uuid NOT NULL, org_id uuid NOT NULL, items jsonb NOT NULL DEFAULT '[]'::jsonb, status text NOT NULL DEFAULT 'pending', total numeric NOT NULL DEFAULT 0, notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bev_vendor_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org view bev orders" ON public.bev_vendor_orders FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Org create bev orders" ON public.bev_vendor_orders FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Vendor view bev orders" ON public.bev_vendor_orders FOR SELECT USING (vendor_id = auth.uid());
CREATE POLICY "Vendor update bev orders" ON public.bev_vendor_orders FOR UPDATE USING (vendor_id = auth.uid());
