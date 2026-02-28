-- Create trigger on auth.users to call handle_new_user on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix the existing user who signed up without the trigger
INSERT INTO public.profiles (user_id, full_name, email)
SELECT 
  '1d5bfdb5-fda6-43f5-8f16-2eeb768f0529',
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  email
FROM auth.users 
WHERE id = '1d5bfdb5-fda6-43f5-8f16-2eeb768f0529';

-- Assign line_chef role (since head_chef already exists)
INSERT INTO public.user_roles (user_id, role)
VALUES ('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'line_chef');

-- Create default permissions for this line chef
INSERT INTO public.module_permissions (user_id, module, can_view, can_edit) VALUES
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'dashboard', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'recipes', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'ingredients', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'invoices', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'inventory', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'prep', true, true),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'production', true, true),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'allergens', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'menu-engineering', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'roster', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'calendar', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'equipment', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'cheatsheets', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'food-safety', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'training', true, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'team', false, false),
('1d5bfdb5-fda6-43f5-8f16-2eeb768f0529', 'marketplace', true, false);