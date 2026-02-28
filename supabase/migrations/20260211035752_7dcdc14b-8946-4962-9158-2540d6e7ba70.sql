
-- =============================================
-- REFERRAL SYSTEM
-- =============================================

-- Referral codes table
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code"
ON public.referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage referral codes"
ON public.referral_codes FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can look up active codes"
ON public.referral_codes FOR SELECT
USING (is_active = true);

-- Referrals tracking table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL UNIQUE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, completed, rewarded
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  reward_tier text -- bronze, silver, gold
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage referrals"
ON public.referrals FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Referral rewards config
CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL UNIQUE, -- bronze, silver, gold
  min_referrals integer NOT NULL,
  reward_description text NOT NULL,
  badge_icon text DEFAULT 'Award',
  badge_color text DEFAULT '#CD7F32',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reward tiers"
ON public.referral_rewards FOR SELECT
USING (true);

CREATE POLICY "Admins can manage reward tiers"
ON public.referral_rewards FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Seed default reward tiers
INSERT INTO public.referral_rewards (tier, min_referrals, reward_description, badge_icon, badge_color) VALUES
('bronze', 3, '1 week free + Bronze Badge', 'Award', '#CD7F32'),
('silver', 10, '1 month free + Silver Badge', 'Trophy', '#C0C0C0'),
('gold', 25, '3 months free + Gold Badge + Featured Profile', 'Crown', '#FFD700');

-- =============================================
-- SIGNUP ALERTS / ONBOARDING TRACKING
-- =============================================

CREATE TABLE public.signup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text,
  user_email text,
  referral_code text,
  welcome_email_sent boolean DEFAULT false,
  onboarding_step text DEFAULT 'registered', -- registered, email_verified, profile_complete, first_recipe
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage signup events"
ON public.signup_events FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for signup_events so admin gets toast
ALTER PUBLICATION supabase_realtime ADD TABLE public.signup_events;

-- =============================================
-- AUTO-GENERATE REFERRAL CODE ON SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_signup_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  ref_code text;
  user_full_name text;
BEGIN
  -- Generate a unique referral code from the user's name
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  ref_code := upper(substring(replace(user_full_name, ' ', ''), 1, 4)) || substring(NEW.id::text, 1, 4);

  -- Create referral code
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, ref_code)
  ON CONFLICT (code) DO UPDATE SET code = ref_code || substring(gen_random_uuid()::text, 1, 3);

  -- Create signup event for admin tracking
  INSERT INTO public.signup_events (user_id, user_name, user_email)
  VALUES (NEW.id, user_full_name, NEW.email);

  RETURN NEW;
END;
$$;

-- Attach to auth trigger (runs after handle_new_user)
CREATE TRIGGER on_new_signup_event
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_signup_event();
