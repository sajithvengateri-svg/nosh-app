
-- Remove FK from profiles to auth.users so we can create employee records without auth accounts
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Remove FK from employee_profiles to profiles (already checked, it exists)
ALTER TABLE public.employee_profiles DROP CONSTRAINT IF EXISTS employee_profiles_user_id_fkey;
