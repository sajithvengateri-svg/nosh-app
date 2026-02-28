-- Fix MoneyOS broken surfer hero image (photo-1502680390548-bdbac40e4a9f returns 404)
UPDATE public.money_landing_sections
SET content = jsonb_set(
  content,
  '{images,2}',
  '{"url": "https://images.unsplash.com/photo-1531722569936-825d3dd91b15?w=1920&q=80&fit=crop", "alt": "Surfer riding a powerful ocean wave — wide shot", "caption": "Run Your Numbers. Then Relax."}'::jsonb
)
WHERE section_key = 'hero';
