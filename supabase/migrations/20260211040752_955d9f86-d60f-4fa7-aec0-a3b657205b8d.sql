
-- =============================================================
-- PHASE 1: Organization Foundation (tables, functions, RLS)
-- =============================================================

-- 1. Organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  owner_id uuid NOT NULL,
  subscription_tier text NOT NULL DEFAULT 'free',
  max_venues integer NOT NULL DEFAULT 1,
  max_members integer NOT NULL DEFAULT 20,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Org venues
CREATE TABLE public.org_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  postcode text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Org memberships
CREATE TABLE public.org_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'line_chef',
  venue_id uuid REFERENCES public.org_venues(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- 4. Add org_id to team_invites
ALTER TABLE public.team_invites ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.team_invites ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.org_venues(id) ON DELETE SET NULL;

-- 5. Add org_id to core data tables
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.prep_lists ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.kitchen_tasks ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.food_safety_logs ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.kitchen_sections ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.roster_shifts ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.cheatsheets ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.cleaning_areas ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON public.org_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON public.org_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_org_venues_org ON public.org_venues(org_id);
CREATE INDEX IF NOT EXISTS idx_recipes_org ON public.recipes(org_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_org ON public.ingredients(org_id);
CREATE INDEX IF NOT EXISTS idx_inventory_org ON public.inventory(org_id);
CREATE INDEX IF NOT EXISTS idx_prep_lists_org ON public.prep_lists(org_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_tasks_org ON public.kitchen_tasks(org_id);

-- 7. Security definer functions
CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT org_id FROM public.org_memberships
  WHERE user_id = _user_id AND is_active = true
$$;

CREATE OR REPLACE FUNCTION public.get_user_primary_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT org_id FROM public.org_memberships
  WHERE user_id = _user_id AND is_active = true
  ORDER BY joined_at ASC LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_memberships
    WHERE user_id = _user_id AND org_id = _org_id AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_memberships
    WHERE user_id = _user_id AND org_id = _org_id AND role = 'owner' AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_head_chef(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_memberships
    WHERE user_id = _user_id AND org_id = _org_id 
      AND role IN ('owner', 'head_chef') AND is_active = true
  )
$$;

-- 8. RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their orgs"
  ON public.organizations FOR SELECT
  USING (id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Owners can update their org"
  ON public.organizations FOR UPDATE
  USING (is_org_owner(auth.uid(), id));

CREATE POLICY "Authenticated users can create orgs"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all orgs"
  ON public.organizations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members can view venues"
  ON public.org_venues FOR SELECT
  USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Org head chefs can manage venues"
  ON public.org_venues FOR ALL
  USING (is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Admins can manage all venues"
  ON public.org_venues FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view org memberships"
  ON public.org_memberships FOR SELECT
  USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Org owners can manage memberships"
  ON public.org_memberships FOR ALL
  USING (is_org_owner(auth.uid(), org_id));

CREATE POLICY "Users can view own memberships"
  ON public.org_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all memberships"
  ON public.org_memberships FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 9. Update handle_new_user to create org on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    
    IF user_role = 'line_chef' THEN
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
$$;

-- 10. Triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_venues_updated_at
  BEFORE UPDATE ON public.org_venues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_memberships_updated_at
  BEFORE UPDATE ON public.org_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
