-- ============================================================================
-- Debug: Wrap handle_new_user in exception handler to identify exact failure
-- ============================================================================

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
  step_name text;
BEGIN
  step_name := 'check_invite';
  SELECT * INTO invite_record FROM public.team_invites
  WHERE email = NEW.email AND accepted_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    step_name := 'invite_accept';
    UPDATE public.team_invites SET accepted_at = now() WHERE id = invite_record.id;
    user_role := invite_record.role;

    step_name := 'invite_profile';
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email)
    ON CONFLICT (user_id) DO NOTHING;

    step_name := 'invite_role';
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, user_role)
    ON CONFLICT DO NOTHING;

    IF invite_record.org_id IS NOT NULL THEN
      step_name := 'invite_membership';
      INSERT INTO public.org_memberships (org_id, user_id, role, venue_id)
      VALUES (invite_record.org_id, NEW.id, user_role, invite_record.venue_id)
      ON CONFLICT DO NOTHING;
    END IF;

    step_name := 'invite_confirm_email';
    UPDATE auth.users SET email_confirmed_at = now() WHERE id = NEW.id;

    -- Skip module_permissions for now to isolate the issue
  ELSE
    step_name := 'new_profile';
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email)
    ON CONFLICT (user_id) DO NOTHING;

    step_name := 'new_role_headchef';
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'head_chef')
    ON CONFLICT DO NOTHING;

    step_name := 'new_role_owner';
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
    ON CONFLICT DO NOTHING;

    v_store_mode := NEW.raw_user_meta_data->>'store_mode';

    step_name := 'new_org';
    INSERT INTO public.organizations (name, slug, owner_id, store_mode)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'org_name',
               COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Kitchen'),
      lower(replace(NEW.id::text, '-', '')),
      NEW.id,
      COALESCE(v_store_mode, 'restaurant')
    )
    RETURNING id INTO new_org_id;

    step_name := 'new_venue';
    INSERT INTO public.org_venues (org_id, name, postcode)
    VALUES (new_org_id, 'Main Kitchen', COALESCE(NEW.raw_user_meta_data->>'postcode', '0000'));

    step_name := 'new_membership';
    INSERT INTO public.org_memberships (org_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');
  END IF;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log the error to a debug table so we can see what failed
  BEGIN
    CREATE TABLE IF NOT EXISTS public._auth_debug_log (
      id serial PRIMARY KEY,
      created_at timestamptz DEFAULT now(),
      step text,
      error_msg text,
      user_email text,
      user_id uuid
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- table already exists
  END;

  INSERT INTO public._auth_debug_log (step, error_msg, user_email, user_id)
  VALUES (step_name, SQLERRM, NEW.email, NEW.id);

  -- Re-raise to maintain the original error behavior
  RAISE;
END;
$function$;
