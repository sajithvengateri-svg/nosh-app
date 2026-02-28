-- Add 'smart' option to nav_mode
ALTER TABLE ds_user_profiles DROP CONSTRAINT IF EXISTS ds_user_profiles_nav_mode_check;
ALTER TABLE ds_user_profiles ADD CONSTRAINT ds_user_profiles_nav_mode_check
  CHECK (nav_mode IN ('feed', 'classic', 'smart'));
