-- Fix MoneyOS hero: surfer image (index 2) and fine dining image (index 3)
-- Surfer: wide beach golden hour shot
-- Fine dining: chef plating dish (proven working from ChefOS)

UPDATE public.money_landing_sections
SET content = jsonb_set(
  jsonb_set(
    content,
    '{images,2}',
    '{"url": "https://images.unsplash.com/photo-1502933691298-84fc14542831?w=1920&q=80&fit=crop", "alt": "Surfer walking towards the ocean on a wide sandy beach at golden hour", "caption": "Run Your Numbers. Then Relax."}'::jsonb
  ),
  '{images,3}',
  '{"url": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1920&q=80&fit=crop", "alt": "Chef carefully plating a fine dining dish in a professional kitchen", "caption": "From Kitchen to Bottom Line"}'::jsonb
)
WHERE section_key = 'hero';
