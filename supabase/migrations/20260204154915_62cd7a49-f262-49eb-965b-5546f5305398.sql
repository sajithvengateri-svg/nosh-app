-- Create role enum
CREATE TYPE public.app_role AS ENUM ('head_chef', 'line_chef');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'line_chef',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    birthday DATE,
    avatar_url TEXT,
    position TEXT DEFAULT 'Line Chef',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_invites table for invitation system
CREATE TABLE public.team_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'line_chef',
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create module_permissions table for per-module access control
CREATE TABLE public.module_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT true,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, module)
);

-- Create direct_messages table for in-app messaging
CREATE TABLE public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is head chef
CREATE OR REPLACE FUNCTION public.is_head_chef(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'head_chef')
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Head chefs can view all roles" ON public.user_roles
FOR SELECT USING (public.is_head_chef(auth.uid()));

CREATE POLICY "Head chefs can manage roles" ON public.user_roles
FOR ALL USING (public.is_head_chef(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Head chefs can update any profile" ON public.profiles
FOR UPDATE USING (public.is_head_chef(auth.uid()));

-- RLS Policies for team_invites
CREATE POLICY "Head chefs can manage invites" ON public.team_invites
FOR ALL USING (public.is_head_chef(auth.uid()));

CREATE POLICY "Anyone can view invite by token" ON public.team_invites
FOR SELECT USING (true);

-- RLS Policies for module_permissions
CREATE POLICY "Users can view their own permissions" ON public.module_permissions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Head chefs can manage all permissions" ON public.module_permissions
FOR ALL USING (public.is_head_chef(auth.uid()));

-- RLS Policies for direct_messages
CREATE POLICY "Users can view their own messages" ON public.direct_messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.direct_messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update read status" ON public.direct_messages
FOR UPDATE USING (auth.uid() = recipient_id);

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_module_permissions_updated_at
BEFORE UPDATE ON public.module_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    (NEW.id, 'team', false, false);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();