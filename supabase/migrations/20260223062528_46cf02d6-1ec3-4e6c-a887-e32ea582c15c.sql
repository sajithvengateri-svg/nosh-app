
-- Add venue_id to prep_lists
ALTER TABLE public.prep_lists ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.org_venues(id) ON DELETE SET NULL;

-- Add venue_id to prep_list_templates
ALTER TABLE public.prep_list_templates ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.org_venues(id) ON DELETE SET NULL;

-- Add org branding columns for invite landing page
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS welcome_message text;

-- Add token column to team_invites if not exists
ALTER TABLE public.team_invites ADD COLUMN IF NOT EXISTS token text UNIQUE;

-- Add venue_id to team_invites for multi-venue invite context
ALTER TABLE public.team_invites ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.org_venues(id) ON DELETE SET NULL;

-- Create get_invite_details RPC (public, no auth required)
CREATE OR REPLACE FUNCTION public.get_invite_details(_token text)
RETURNS TABLE(
  invite_id uuid,
  email text,
  role app_role,
  expires_at timestamptz,
  accepted_at timestamptz,
  org_id uuid,
  org_name text,
  org_logo_url text,
  org_welcome_message text,
  org_cover_image_url text,
  inviter_name text,
  venue_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ti.id AS invite_id,
    ti.email,
    ti.role,
    ti.expires_at,
    ti.accepted_at,
    o.id AS org_id,
    o.name AS org_name,
    o.logo_url AS org_logo_url,
    o.welcome_message AS org_welcome_message,
    o.cover_image_url AS org_cover_image_url,
    COALESCE(p.full_name, 'Your manager') AS inviter_name,
    v.name AS venue_name
  FROM public.team_invites ti
  LEFT JOIN public.organizations o ON o.id = ti.org_id
  LEFT JOIN public.profiles p ON p.user_id = ti.invited_by
  LEFT JOIN public.org_venues v ON v.id = ti.venue_id
  WHERE ti.token = _token
    AND ti.accepted_at IS NULL
    AND ti.expires_at > now()
  LIMIT 1;
$$;
