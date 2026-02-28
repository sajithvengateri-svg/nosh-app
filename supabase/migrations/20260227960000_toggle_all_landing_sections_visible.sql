-- Force ALL landing page sections to is_visible = true across every table
UPDATE public.landing_sections SET is_visible = true WHERE is_visible = false;
UPDATE public.home_cook_landing_sections SET is_visible = true WHERE is_visible = false;
UPDATE public.money_landing_sections SET is_visible = true WHERE is_visible = false;
UPDATE public.vendor_landing_sections SET is_visible = true WHERE is_visible = false;
UPDATE public.food_safety_landing_sections SET is_visible = true WHERE is_visible = false;
UPDATE public.indian_chefos_landing_sections SET is_visible = true WHERE is_visible = false;
UPDATE public.gcc_chefos_landing_sections SET is_visible = true WHERE is_visible = false;
