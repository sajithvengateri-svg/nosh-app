
-- Insert feature release for todo (without ON CONFLICT since no unique constraint)
INSERT INTO public.feature_releases (module_slug, module_name, description, status)
SELECT 'todo', 'Todo List', 'Task and shopping list management', 'released'
WHERE NOT EXISTS (SELECT 1 FROM public.feature_releases WHERE module_slug = 'todo');
