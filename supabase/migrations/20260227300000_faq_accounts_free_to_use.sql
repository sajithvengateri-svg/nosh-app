-- Update existing "Is the app free to use?" FAQ, or insert if missing
DELETE FROM public.help_articles
WHERE lower(title) = 'is the app free to use?'
  AND category = 'faq';

INSERT INTO public.help_articles (module, page, title, subtitle, icon, category, steps, tags, sort_order, is_published)
VALUES (
  'chefos',
  'faq',
  'Is the app free to use?',
  'Pricing, free period, and tiered plans',
  'CreditCard',
  'faq',
  '[{"step_number":1,"title":"Free to use during the launch period","instruction":"Yes! The app is completely free to use during our launch period. You get full access to all core features at no cost so you can explore everything the platform has to offer.","tips":"Make the most of the free period to set up your recipes, ingredients, and workflows."},{"step_number":2,"title":"Tiered plans after the free period","instruction":"After the free period ends we will introduce tiered pricing plans. Plans will be based on the features you need — from a free basic tier for small operations through to professional and enterprise plans for larger teams and advanced functionality.","tips":"We will give plenty of notice before any pricing changes. Your data and setup will always be preserved."}]',
  ARRAY['general', 'accounts', 'data', 'free', 'pricing', 'plans', 'cost'],
  100,
  true
);
