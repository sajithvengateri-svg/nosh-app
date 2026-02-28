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
BEGIN
  -- Check if user was invited
  SELECT * INTO invite_record FROM public.team_invites 
  WHERE email = NEW.email AND accepted_at IS NULL AND expires_at > now()
  LIMIT 1;
  
  IF invite_record IS NOT NULL THEN
    user_role := invite_record.role;
    UPDATE public.team_invites SET accepted_at = now() WHERE id = invite_record.id;
    
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email);
    
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, user_role);
    
    -- Join the org from invite
    IF invite_record.org_id IS NOT NULL THEN
      INSERT INTO public.org_memberships (org_id, user_id, role, venue_id)
      VALUES (invite_record.org_id, NEW.id, user_role, invite_record.venue_id);
    END IF;
    
    -- Set module permissions based on role
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
      (NEW.id, 'marketplace', true, false);
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
      (NEW.id, 'marketplace', false, false);
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
      (NEW.id, 'marketplace', true, false);
    END IF;
  ELSE
    -- New independent signup → create org as owner
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email);
    
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'head_chef');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
    
    INSERT INTO public.organizations (name, slug, owner_id)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'org_name', 
               COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Kitchen'),
      lower(replace(NEW.id::text, '-', ''))
    , NEW.id)
    RETURNING id INTO new_org_id;
    
    INSERT INTO public.org_venues (org_id, name, postcode)
    VALUES (new_org_id, 'Main Kitchen', COALESCE(NEW.raw_user_meta_data->>'postcode', '0000'));
    
    INSERT INTO public.org_memberships (org_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');
  END IF;
  
  RETURN NEW;
END;
$function$;