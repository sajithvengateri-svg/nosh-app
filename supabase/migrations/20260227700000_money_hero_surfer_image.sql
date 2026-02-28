-- Swap beach image for happy surfer at golden hour
UPDATE public.money_landing_sections
SET content = jsonb_set(
  content,
  '{images,2}',
  '{"url": "https://images.unsplash.com/photo-1502933691298-84fc14542831?w=1920&q=80&fit=crop", "alt": "Happy surfer walking along the beach carrying a surfboard at golden hour", "caption": "Run Your Numbers. Then Relax."}'::jsonb
)
WHERE section_key = 'hero';
