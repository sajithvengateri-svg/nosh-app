-- ============================================================================
-- Cleanup: Remove debug auth artifacts
-- The debug migrations (20260301000002-6) were temporary troubleshooting tools.
-- This migration:
--   1. Restores handle_new_user() to the proper version (from fix_auth_triggers)
--   2. Restores handle_new_signup_event() to the proper version
--   3. Drops debug helper functions
--   4. Drops debug log table
-- ============================================================================

-- 1. Restore handle_new_user() — proper version with module_permissions, NO error swallowing
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invite_record RECORD;
  user_role app_role;
  new_org_id uuid;
  v_store_mode text;
BEGIN
  SELECT * INTO invite_record FROM public.team_invites
  WHERE email = NEW.email AND accepted_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    user_role := invite_record.role;
    UPDATE public.team_invites SET accepted_at = now() WHERE id = invite_record.id;

    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, user_role)
    ON CONFLICT DO NOTHING;

    IF invite_record.org_id IS NOT NULL THEN
      INSERT INTO public.org_memberships (org_id, user_id, role, venue_id)
      VALUES (invite_record.org_id, NEW.id, user_role, invite_record.venue_id)
      ON CONFLICT DO NOTHING;
    END IF;

    UPDATE auth.users SET email_confirmed_at = now() WHERE id = NEW.id;

    IF user_role = 'sous_chef' THEN
      INSERT INTO public.module_permissions (user_id, module, can_view, can_edit) VALUES
      (NEW.id, 'dashboard', true, true), (NEW.id, 'recipes', true, true),
      (NEW.id, 'ingredients', true, true), (NEW.id, 'invoices', true, true),
      (NEW.id, 'inventory', true, true), (NEW.id, 'prep', true, true),
      (NEW.id, 'production', true, true), (NEW.id, 'allergens', true, true),
      (NEW.id, 'menu-engineering', true, true), (NEW.id, 'roster', true, false),
      (NEW.id, 'calendar', true, true), (NEW.id, 'equipment', true, true),
      (NEW.id, 'cheatsheets', true, true), (NEW.id, 'food-safety', true, true),
      (NEW.id, 'training', true, true), (NEW.id, 'team', true, false),
      (NEW.id, 'marketplace', true, false)
      ON CONFLICT DO NOTHING;
    ELSIF user_role = 'kitchen_hand' THEN
      INSERT INTO public.module_permissions (user_id, module, can_view, can_edit) VALUES
      (NEW.id, 'dashboard', true, false), (NEW.id, 'recipes', true, false),
      (NEW.id, 'ingredients', false, false), (NEW.id, 'invoices', false, false),
      (NEW.id, 'inventory', false, false), (NEW.id, 'prep', true, true),
      (NEW.id, 'production', true, true), (NEW.id, 'allergens', true, false),
      (NEW.id, 'menu-engineering', false, false), (NEW.id, 'roster', true, false),
      (NEW.id, 'calendar', true, false), (NEW.id, 'equipment', true, false),
      (NEW.id, 'cheatsheets', true, false), (NEW.id, 'food-safety', true, false),
      (NEW.id, 'training', true, false), (NEW.id, 'team', false, false),
      (NEW.id, 'marketplace', false, false)
      ON CONFLICT DO NOTHING;
    ELSIF user_role = 'line_chef' THEN
      INSERT INTO public.module_permissions (user_id, module, can_view, can_edit) VALUES
      (NEW.id, 'dashboard', true, false), (NEW.id, 'recipes', true, false),
      (NEW.id, 'ingredients', true, false), (NEW.id, 'invoices', true, false),
      (NEW.id, 'inventory', true, false), (NEW.id, 'prep', true, true),
      (NEW.id, 'production', true, true), (NEW.id, 'allergens', true, false),
      (NEW.id, 'menu-engineering', true, false), (NEW.id, 'roster', true, false),
      (NEW.id, 'calendar', true, false), (NEW.id, 'equipment', true, false),
      (NEW.id, 'cheatsheets', true, false), (NEW.id, 'food-safety', true, false),
      (NEW.id, 'training', true, false), (NEW.id, 'team', false, false),
      (NEW.id, 'marketplace', true, false)
      ON CONFLICT DO NOTHING;
    END IF;
  ELSE
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'head_chef')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
    ON CONFLICT DO NOTHING;

    v_store_mode := NEW.raw_user_meta_data->>'store_mode';

    INSERT INTO public.organizations (name, slug, owner_id, store_mode)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'org_name',
               COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Kitchen'),
      lower(replace(NEW.id::text, '-', '')),
      NEW.id,
      COALESCE(v_store_mode, 'restaurant')
    )
    RETURNING id INTO new_org_id;

    INSERT INTO public.org_venues (org_id, name, postcode)
    VALUES (new_org_id, 'Main Kitchen', COALESCE(NEW.raw_user_meta_data->>'postcode', '0000'));

    INSERT INTO public.org_memberships (org_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Restore handle_new_signup_event() — proper version
CREATE OR REPLACE FUNCTION public.handle_new_signup_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ref_code text;
  user_full_name text;
  v_store_mode text;
BEGIN
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  ref_code := upper(substring(replace(user_full_name, ' ', ''), 1, 4)) || substring(NEW.id::text, 1, 4);
  v_store_mode := NEW.raw_user_meta_data->>'store_mode';

  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, ref_code)
  ON CONFLICT (code) DO UPDATE SET code = ref_code || substring(gen_random_uuid()::text, 1, 3);

  INSERT INTO public.signup_events (user_id, user_name, user_email, store_mode)
  VALUES (NEW.id, user_full_name, NEW.email, v_store_mode);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_signup_event failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 3. Drop debug helper functions
DROP FUNCTION IF EXISTS public.debug_list_auth_triggers();
DROP FUNCTION IF EXISTS public.debug_auth_users_columns();
DROP FUNCTION IF EXISTS public.debug_auth_schema_versions();
DROP FUNCTION IF EXISTS public.debug_get_ds_function();

-- 4. Drop debug log table
DROP TABLE IF EXISTS public._auth_debug_log;
