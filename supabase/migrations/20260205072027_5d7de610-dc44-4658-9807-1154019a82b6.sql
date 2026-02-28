-- Create admin-specific permissions table for granular control center access
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    permission_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, permission_type)
);

-- Enable RLS on admin_permissions
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin permissions
CREATE POLICY "Admins can view admin permissions"
ON public.admin_permissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can manage admin permissions
CREATE POLICY "Admins can manage admin permissions"
ON public.admin_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;