
-- Step 1: Add new BevOS role values to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'bar_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'asst_bar_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'senior_bartender';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'bartender';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'barback';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'barista';
