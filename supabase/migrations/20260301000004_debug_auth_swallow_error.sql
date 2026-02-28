-- Debug: Swallow error in handle_new_user so debug log persists
-- TEMPORARY - will revert after finding the issue

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
  -- Check if user was invited
  SELECT * INTO invite_record FROM public.team_invites
  WHERE email = NEW.email AND accepted_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    UPDATE public.team_invites SET accepted_at = now() WHERE id = invite_record.id;
    user_role := invite_record.role;

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

EXCEPTION WHEN OTHERS THEN
  -- Don't re-raise — just log and allow signup to succeed
  INSERT INTO public._auth_debug_log (step, error_msg, user_email, user_id)
  VALUES ('handle_new_user', SQLERRM, NEW.email, NEW.id);
  RETURN NEW;
END;
$function$;

-- Also make handle_new_signup_event fully safe
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
  INSERT INTO public._auth_debug_log (step, error_msg, user_email, user_id)
  VALUES ('handle_new_signup_event', SQLERRM, NEW.email, NEW.id);
  RETURN NEW;
END;
$function$;
