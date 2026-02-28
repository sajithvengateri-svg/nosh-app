-- Add carousel hero images to MoneyOS landing page
UPDATE public.money_landing_sections
SET content = '{
  "carousel_enabled": true,
  "button_text": "Get Started Free",
  "button_link": "/auth?tab=signup&source=moneyos",
  "images": [
    {
      "url": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80&fit=crop",
      "alt": "Elegant restaurant interior with warm ambient lighting",
      "caption": "Built for Hospitality"
    },
    {
      "url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80&fit=crop",
      "alt": "Financial data and charts displayed on multiple trading screens",
      "caption": "Real-Time Financial Intelligence"
    },
    {
      "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80&fit=crop",
      "alt": "Serene tropical beach with crystal clear water",
      "caption": "Run Your Numbers. Then Relax."
    },
    {
      "url": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80&fit=crop",
      "alt": "Waiter presenting a beautifully plated fine dining dish",
      "caption": "From Kitchen to Bottom Line"
    }
  ]
}'::jsonb
WHERE section_key = 'hero';
