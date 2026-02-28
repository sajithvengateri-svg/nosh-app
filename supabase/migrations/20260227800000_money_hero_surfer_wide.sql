-- Swap surfer image to wide aerial shot of lone surfer in turbulent waves
UPDATE public.money_landing_sections
SET content = jsonb_set(
  content,
  '{images,2}',
  '{"url": "https://images.unsplash.com/photo-1502680390548-bdbac40e4a9f?w=1920&q=80&fit=crop", "alt": "Lone surfer steady among crashing ocean waves — aerial wide shot", "caption": "Run Your Numbers. Then Relax."}'::jsonb
)
WHERE section_key = 'hero';
