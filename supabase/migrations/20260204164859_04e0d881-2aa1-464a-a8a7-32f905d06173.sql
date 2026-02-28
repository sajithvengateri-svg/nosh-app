-- Update handle_new_user function to include marketplace module
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invite_record RECORD;
  user_role app_role;
BEGIN
  -- Check if user was invited
  SELECT * INTO invite_record FROM public.team_invites 
  WHERE email = NEW.email AND accepted_at IS NULL AND expires_at > now()
  LIMIT 1;
  
  IF invite_record IS NOT NULL THEN
    user_role := invite_record.role;
    -- Mark invite as accepted
    UPDATE public.team_invites SET accepted_at = now() WHERE id = invite_record.id;
  ELSE
    -- First user becomes head chef, others become line chef
    IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
      user_role := 'head_chef';
    ELSE
      user_role := 'line_chef';
    END IF;
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email);
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- Create default permissions for line chefs
  IF user_role = 'line_chef' THEN
    INSERT INTO public.module_permissions (user_id, module, can_view, can_edit) VALUES
    (NEW.id, 'dashboard', true, false),
    (NEW.id, 'recipes', true, false),
    (NEW.id, 'ingredients', true, false),
    (NEW.id, 'invoices', true, false),
    (NEW.id, 'inventory', true, false),
    (NEW.id, 'prep', true, true),
    (NEW.id, 'production', true, true),
    (NEW.id, 'allergens', true, false),
    (NEW.id, 'menu-engineering', true, false),
    (NEW.id, 'roster', true, false),
    (NEW.id, 'calendar', true, false),
    (NEW.id, 'equipment', true, false),
    (NEW.id, 'cheatsheets', true, false),
    (NEW.id, 'food-safety', true, false),
    (NEW.id, 'training', true, false),
    (NEW.id, 'team', false, false),
    (NEW.id, 'marketplace', true, false);
  END IF;
  
  RETURN NEW;
END;
$function$;