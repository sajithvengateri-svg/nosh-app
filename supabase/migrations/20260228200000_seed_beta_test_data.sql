-- ============================================================================
-- Seed Beta Test Data
-- ============================================================================
-- Creates realistic test data across all verticals for beta testing.
-- All test users get accepted_terms_at and beta_tester tag.
-- Run AFTER 20260228100000_beta_terms_and_tags.sql
-- ============================================================================

-- ─── 1. Organizations ──────────────────────────────────────────────────────
-- Note: owner_id uses a dummy UUID; the real admin user will claim ownership on login.
-- The on_auth_user_created trigger handles org creation for new signups, so these
-- are purely for demo/test data display.

INSERT INTO organizations (id, name, slug, subscription_tier, store_mode, owner_id, max_venues, max_members, ai_addon_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'The Golden Fork',       'golden-fork',      'premium', 'restaurant', '00000000-0000-0000-0000-000000000000', 3, 20, true),
  ('a0000000-0000-0000-0000-000000000002', 'Sakura Kitchen',        'sakura-kitchen',    'pro',     'restaurant', '00000000-0000-0000-0000-000000000000', 5, 50, true),
  ('a0000000-0000-0000-0000-000000000003', 'Coastal Bites Cafe',    'coastal-bites',     'free',    'cafe',       '00000000-0000-0000-0000-000000000000', 1, 5,  false),
  ('a0000000-0000-0000-0000-000000000004', 'The Velvet Lounge',     'velvet-lounge',     'premium', 'bar',        '00000000-0000-0000-0000-000000000000', 2, 15, true),
  ('a0000000-0000-0000-0000-000000000005', 'Spice Route Catering',  'spice-route',       'pro',     'catering',   '00000000-0000-0000-0000-000000000000', 3, 30, true)
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Suppliers ──────────────────────────────────────────────────────────

INSERT INTO suppliers (id, name, category, rep_name, phone, email)
VALUES
  (gen_random_uuid(), 'Fresh Farms AU',     'Produce',   'Mike Chen',    '0412345678', 'mike@freshfarms.au'),
  (gen_random_uuid(), 'Pacific Seafood',    'Seafood',   'Sarah Lee',    '0423456789', 'sarah@pacificseafood.au'),
  (gen_random_uuid(), 'Metro Meats',        'Meat',      'Dave Wilson',  '0434567890', 'dave@metromeats.au'),
  (gen_random_uuid(), 'Asian Grocery Co',   'Dry Goods', 'Lin Zhang',    '0445678901', 'lin@asiangrocery.au'),
  (gen_random_uuid(), 'Kikkoman Australia', 'Dry Goods', 'Trade Dept',   '0456789012', 'trade@kikkoman.au'),
  (gen_random_uuid(), 'Premium Spirits',    'Beverages', 'James Hart',   '0467890123', 'james@premspirits.au')
ON CONFLICT DO NOTHING;

-- ─── 3. Ingredients (50+) ──────────────────────────────────────────────────

INSERT INTO ingredients (id, org_id, name, category, unit, cost_per_unit, par_level, allergens)
VALUES
  -- Golden Fork ingredients
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Atlantic Salmon Fillet',  'Protein',    'kg',    32.00, 5,  ARRAY['fish']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Wagyu Scotch Fillet',     'Protein',    'kg',    85.00, 3,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Chicken Breast',          'Protein',    'kg',    12.50, 10, ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Arborio Rice',            'Dry Goods',  'kg',     4.50, 8,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Parmesan Reggiano',       'Dairy',      'kg',    42.00, 3,  ARRAY['dairy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Heavy Cream',             'Dairy',      'L',      6.50, 8,  ARRAY['dairy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Butter (unsalted)',       'Dairy',      'kg',    12.00, 5,  ARRAY['dairy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Fresh Basil',             'Herbs',      'bunch',  3.50, 6,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Garlic',                  'Produce',    'kg',     8.00, 3,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Onion (brown)',            'Produce',    'kg',     2.50, 10, ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Tomato (vine-ripened)',    'Produce',    'kg',     6.00, 8,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Lemon',                   'Produce',    'kg',     4.50, 5,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Baby Spinach',            'Produce',    'kg',    14.00, 4,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Extra Virgin Olive Oil',  'Oils',       'L',     12.00, 5,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Balsamic Vinegar',        'Condiments', 'L',     18.00, 2,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Dijon Mustard',           'Condiments', 'kg',    14.00, 2,  ARRAY['mustard']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Plain Flour',             'Dry Goods',  'kg',     1.80, 10, ARRAY['gluten']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Eggs (free range)',        'Dairy',      'dozen',  7.50, 5,  ARRAY['eggs']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Dark Chocolate 70%',      'Baking',     'kg',    22.00, 3,  ARRAY['dairy','soy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Vanilla Extract',         'Baking',     'L',     45.00, 1,  ARRAY[]::text[]),
  -- Sakura Kitchen ingredients
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Sushi Grade Tuna',        'Protein',    'kg',    55.00, 4,  ARRAY['fish']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Sashimi Salmon',          'Protein',    'kg',    38.00, 5,  ARRAY['fish']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Wagyu A5 Striploin',      'Protein',    'kg',   180.00, 2,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Koshihikari Rice',        'Dry Goods',  'kg',     6.00, 20, ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Nori Sheets',             'Dry Goods',  'pack',   8.00, 10, ARRAY['sesame']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Soy Sauce (Kikkoman)',    'Condiments', 'L',      7.50, 5,  ARRAY['soy','gluten']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Mirin',                   'Condiments', 'L',     10.00, 3,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Rice Vinegar',            'Condiments', 'L',      5.00, 3,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Wasabi (fresh)',           'Produce',    'kg',   120.00, 1,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Pickled Ginger',          'Condiments', 'kg',    16.00, 2,  ARRAY[]::text[]),
  -- Coastal Bites
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'Sourdough Bread',         'Bakery',     'loaf',   6.50, 10, ARRAY['gluten']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'Avocado',                 'Produce',    'each',   3.00, 15, ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'Halloumi',                'Dairy',      'kg',    24.00, 4,  ARRAY['dairy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'Espresso Beans (1kg)',    'Beverages',  'kg',    35.00, 3,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'Full Cream Milk',         'Dairy',      'L',      2.20, 20, ARRAY['dairy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'Smoked Salmon',           'Protein',    'kg',    42.00, 3,  ARRAY['fish']),
  -- Velvet Lounge
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'Hendricks Gin',           'Spirits',    'bottle', 65.00, 3,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'Angostura Bitters',       'Spirits',    'bottle', 18.00, 2,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'Lime (fresh)',             'Produce',    'kg',     6.00, 5,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'Simple Syrup',            'Beverages',  'L',      8.00, 3,  ARRAY[]::text[]),
  -- Spice Route
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Lamb Shoulder',           'Protein',    'kg',    18.00, 10, ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Chickpeas (dried)',       'Dry Goods',  'kg',     3.50, 15, ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Basmati Rice',            'Dry Goods',  'kg',     4.00, 20, ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Garam Masala',            'Spices',     'kg',    28.00, 2,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Turmeric Powder',         'Spices',     'kg',    16.00, 2,  ARRAY[]::text[]),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Greek Yoghurt',           'Dairy',      'kg',     8.00, 5,  ARRAY['dairy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Pita Bread',              'Bakery',     'pack',   4.50, 10, ARRAY['gluten']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Tahini',                  'Condiments', 'kg',    14.00, 3,  ARRAY['sesame'])
ON CONFLICT DO NOTHING;

-- ─── 4. Recipes (30+) ─────────────────────────────────────────────────────

INSERT INTO recipes (id, org_id, name, category, servings, prep_time, cook_time, ingredients, instructions, allergens)
VALUES
  -- Golden Fork
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Pan-Seared Salmon with Lemon Butter',       'Mains',    4, 15, 20, '[{"name":"Atlantic Salmon Fillet","qty":800,"unit":"g"},{"name":"Butter","qty":60,"unit":"g"},{"name":"Lemon","qty":2,"unit":"each"},{"name":"Garlic","qty":3,"unit":"cloves"},{"name":"Baby Spinach","qty":200,"unit":"g"}]', '["Season salmon with salt and pepper","Heat oil in pan over high heat","Sear salmon skin-side down 4 min","Flip and cook 3 min more","Add butter, garlic, and lemon juice","Baste salmon, serve over wilted spinach"]', ARRAY['fish','dairy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Wagyu Scotch Fillet with Jus',              'Mains',    2, 10, 25, '[{"name":"Wagyu Scotch Fillet","qty":500,"unit":"g"},{"name":"Butter","qty":40,"unit":"g"},{"name":"Garlic","qty":2,"unit":"cloves"},{"name":"Fresh Thyme","qty":4,"unit":"sprigs"}]', '["Temper steak 30 min at room temp","Season generously","Sear in smoking hot pan 3 min each side","Rest 8 min","Make jus from pan drippings"]', ARRAY['dairy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Mushroom Risotto',                          'Mains',    4, 10, 35, '[{"name":"Arborio Rice","qty":400,"unit":"g"},{"name":"Parmesan Reggiano","qty":100,"unit":"g"},{"name":"Butter","qty":50,"unit":"g"},{"name":"Onion","qty":1,"unit":"each"},{"name":"Garlic","qty":2,"unit":"cloves"}]', '["Sauté onion and garlic","Toast rice 2 min","Add wine, stir until absorbed","Add stock ladle by ladle","Finish with parmesan and butter"]', ARRAY['dairy','gluten']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Classic Caesar Salad',                      'Starters', 4, 15, 5,  '[{"name":"Cos Lettuce","qty":2,"unit":"heads"},{"name":"Parmesan Reggiano","qty":80,"unit":"g"},{"name":"Eggs","qty":2,"unit":"each"},{"name":"Garlic","qty":3,"unit":"cloves"},{"name":"Dijon Mustard","qty":1,"unit":"tbsp"}]', '["Make dressing: egg yolks, garlic, mustard, anchovy, oil","Tear lettuce, toss with dressing","Shave parmesan","Top with croutons"]', ARRAY['eggs','dairy','gluten','fish']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Chocolate Fondant',                         'Desserts', 6, 20, 14, '[{"name":"Dark Chocolate 70%","qty":200,"unit":"g"},{"name":"Butter","qty":100,"unit":"g"},{"name":"Eggs","qty":4,"unit":"each"},{"name":"Plain Flour","qty":40,"unit":"g"},{"name":"Vanilla Extract","qty":1,"unit":"tsp"}]', '["Melt chocolate and butter","Whisk eggs and sugar","Fold in chocolate mixture","Add flour gently","Bake at 200C for 12-14 min","Centre should be molten"]', ARRAY['dairy','eggs','gluten','soy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Panna Cotta with Berry Coulis',             'Desserts', 6, 15, 5,  '[{"name":"Heavy Cream","qty":600,"unit":"ml"},{"name":"Vanilla Extract","qty":2,"unit":"tsp"},{"name":"Sugar","qty":80,"unit":"g"}]', '["Bloom gelatine","Heat cream with sugar and vanilla","Add gelatine","Pour into moulds","Set 4 hours","Make berry coulis from fresh berries"]', ARRAY['dairy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'French Onion Soup',                         'Starters', 4, 15, 60, '[{"name":"Onion (brown)","qty":1000,"unit":"g"},{"name":"Butter","qty":60,"unit":"g"},{"name":"Garlic","qty":4,"unit":"cloves"}]', '["Slowly caramelise onions (45 min)","Add stock and herbs","Simmer 15 min","Ladle into bowls","Top with gruyere crouton","Broil until bubbly"]', ARRAY['dairy','gluten']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Bearnaise Sauce',                           'Sauces',   8, 10, 15, '[{"name":"Butter","qty":250,"unit":"g"},{"name":"Eggs","qty":3,"unit":"yolks"},{"name":"Fresh Tarragon","qty":20,"unit":"g"}]', '["Make reduction with vinegar, shallot, tarragon","Whisk yolks over bain-marie","Slowly add clarified butter","Season and strain"]', ARRAY['dairy','eggs']),
  -- Sakura Kitchen
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Nigiri Sushi Platter (12pc)',               'Mains',    2, 30, 10, '[{"name":"Sashimi Salmon","qty":200,"unit":"g"},{"name":"Sushi Grade Tuna","qty":200,"unit":"g"},{"name":"Koshihikari Rice","qty":400,"unit":"g"},{"name":"Rice Vinegar","qty":60,"unit":"ml"},{"name":"Wasabi","qty":20,"unit":"g"},{"name":"Nori Sheets","qty":4,"unit":"sheets"}]', '["Cook and season sushi rice","Slice fish precisely","Form rice balls","Top with fish, dab of wasabi","Serve with pickled ginger and soy"]', ARRAY['fish','soy','sesame']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Tonkotsu Ramen',                            'Mains',    4, 30, 720,'[{"name":"Pork Bones","qty":2000,"unit":"g"},{"name":"Koshihikari Rice","qty":200,"unit":"g"},{"name":"Soy Sauce","qty":100,"unit":"ml"},{"name":"Mirin","qty":50,"unit":"ml"}]', '["Boil pork bones 12 hours for broth","Make tare (soy + mirin)","Cook noodles al dente","Assemble: broth, tare, noodles","Top with chashu, egg, nori, scallion"]', ARRAY['soy','gluten','eggs']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Wagyu Tataki',                              'Starters', 4, 10, 5,  '[{"name":"Wagyu A5 Striploin","qty":300,"unit":"g"},{"name":"Soy Sauce","qty":50,"unit":"ml"},{"name":"Rice Vinegar","qty":30,"unit":"ml"}]', '["Sear wagyu 30 sec each side","Ice bath immediately","Slice paper thin","Dress with ponzu","Garnish with micro greens and sesame"]', ARRAY['soy','sesame']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Miso Soup',                                 'Starters', 4, 5,  10, '[{"name":"Dashi Stock","qty":1000,"unit":"ml"},{"name":"White Miso","qty":60,"unit":"g"},{"name":"Silken Tofu","qty":200,"unit":"g"}]', '["Heat dashi to simmer","Dissolve miso paste","Add tofu cubes","Garnish with wakame and spring onion"]', ARRAY['soy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Matcha Tiramisu',                           'Desserts', 8, 25, 0,  '[{"name":"Mascarpone","qty":500,"unit":"g"},{"name":"Eggs","qty":4,"unit":"each"},{"name":"Matcha Powder","qty":30,"unit":"g"}]', '["Whisk yolks with sugar","Fold in mascarpone","Whip whites to soft peak","Fold together","Layer with matcha-soaked ladyfingers","Set 6 hours"]', ARRAY['dairy','eggs','gluten']),
  -- Coastal Bites
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'Smashed Avo on Sourdough',                  'Breakfast', 2, 5,  3,  '[{"name":"Avocado","qty":2,"unit":"each"},{"name":"Sourdough Bread","qty":2,"unit":"slices"},{"name":"Lemon","qty":0.5,"unit":"each"}]', '["Toast sourdough","Smash avocado with lemon, salt, chilli","Spread on toast","Top with poached egg, dukkah"]', ARRAY['gluten','eggs']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'Halloumi Stack',                            'Breakfast', 2, 10, 8,  '[{"name":"Halloumi","qty":200,"unit":"g"},{"name":"Avocado","qty":1,"unit":"each"},{"name":"Tomato","qty":2,"unit":"each"}]', '["Grill halloumi slices","Layer with avocado, tomato, spinach","Drizzle balsamic reduction","Serve with sourdough"]', ARRAY['dairy','gluten']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'Flat White',                                'Beverages', 1, 2,  3,  '[{"name":"Espresso Beans","qty":18,"unit":"g"},{"name":"Full Cream Milk","qty":180,"unit":"ml"}]', '["Pull double shot espresso","Steam milk to 60-65C microfoam","Pour with thin white dot"]', ARRAY['dairy']),
  -- Spice Route
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Lamb Shawarma Platter',                     'Mains',    6, 30, 120, '[{"name":"Lamb Shoulder","qty":2000,"unit":"g"},{"name":"Greek Yoghurt","qty":200,"unit":"g"},{"name":"Garam Masala","qty":30,"unit":"g"},{"name":"Pita Bread","qty":6,"unit":"each"}]', '["Marinate lamb in spices and yoghurt overnight","Slow roast 2 hours","Shred and crisp","Serve with pita, hummus, pickled veg"]', ARRAY['dairy','gluten','sesame']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Hummus (house-made)',                       'Sides',    8, 10, 5,   '[{"name":"Chickpeas","qty":400,"unit":"g"},{"name":"Tahini","qty":80,"unit":"g"},{"name":"Lemon","qty":2,"unit":"each"},{"name":"Garlic","qty":3,"unit":"cloves"}]', '["Blend chickpeas until smooth","Add tahini, lemon, garlic","Season and drizzle olive oil","Garnish with paprika and sumac"]', ARRAY['sesame']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Chicken Biryani',                           'Mains',    6, 30, 45,  '[{"name":"Chicken Breast","qty":1000,"unit":"g"},{"name":"Basmati Rice","qty":500,"unit":"g"},{"name":"Garam Masala","qty":15,"unit":"g"},{"name":"Turmeric Powder","qty":10,"unit":"g"},{"name":"Greek Yoghurt","qty":150,"unit":"g"}]', '["Marinate chicken in yoghurt and spices","Par-cook rice with whole spices","Layer chicken and rice","Seal and dum cook 25 min","Garnish with fried onion and mint"]', ARRAY['dairy']),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Baklava',                                   'Desserts', 12, 30, 45,  '[{"name":"Filo Pastry","qty":500,"unit":"g"},{"name":"Pistachios","qty":300,"unit":"g"},{"name":"Butter","qty":200,"unit":"g"},{"name":"Honey","qty":250,"unit":"g"}]', '["Layer buttered filo sheets","Add nut mixture every 3 layers","Cut into diamonds before baking","Bake at 175C for 40 min","Pour cooled honey syrup over hot baklava"]', ARRAY['gluten','dairy','nuts'])
ON CONFLICT DO NOTHING;

-- ─── 5. Kitchen Sections ───────────────────────────────────────────────────

INSERT INTO kitchen_sections (id, org_id, name, color, sort_order, is_active)
VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Hot Section',    '#ef4444', 1, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Cold Section',   '#3b82f6', 2, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Pastry',         '#f59e0b', 3, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Garde Manger',   '#22c55e', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Sushi Bar',      '#ef4444', 1, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Robata Grill',   '#f97316', 2, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Tempura Station','#eab308', 3, true)
ON CONFLICT DO NOTHING;

-- ─── 6. Fixed Costs (for MoneyOS P&L) ──────────────────────────────────────

INSERT INTO fixed_costs (id, org_id, name, category, amount_usd, frequency, is_active, starts_at)
VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Rent',                'rent',       8500.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Insurance',           'insurance',  1200.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Electricity',         'utilities',   950.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Gas',                 'utilities',   420.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Water',               'utilities',   180.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'POS Software',        'technology',  150.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Rent',                'rent',      12000.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Insurance',           'insurance',  1800.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'Electricity',         'utilities',  1400.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'Rent',                'rent',       3500.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'Rent',                'rent',       6000.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'Liquor License',      'licenses',    400.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Commercial Kitchen',  'rent',       4500.00, 'monthly', true, '2026-01-01'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'Vehicle Lease',       'transport',   800.00, 'monthly', true, '2026-01-01'),
  -- System-wide (no org_id)
  (gen_random_uuid(), NULL, 'Supabase Pro',        'infrastructure', 25.00,   'monthly', true, '2026-01-01'),
  (gen_random_uuid(), NULL, 'Vercel Pro',          'infrastructure', 20.00,   'monthly', true, '2026-01-01'),
  (gen_random_uuid(), NULL, 'Domain (chefos.app)', 'infrastructure', 15.00,   'yearly',  true, '2026-01-01')
ON CONFLICT DO NOTHING;

-- ─── 7. Revenue Log (for MoneyOS P&L) ──────────────────────────────────────

INSERT INTO revenue_log (org_id, revenue_type, amount_usd, period_start, period_end, created_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'subscription', 99.00,  '2026-02-01', '2026-02-28', '2026-02-01 00:00:00+10'),
  ('a0000000-0000-0000-0000-000000000001', 'food_sales',   42500.00, '2026-02-01', '2026-02-28', '2026-02-15 00:00:00+10'),
  ('a0000000-0000-0000-0000-000000000002', 'subscription', 199.00, '2026-02-01', '2026-02-28', '2026-02-01 00:00:00+10'),
  ('a0000000-0000-0000-0000-000000000002', 'food_sales',   68000.00, '2026-02-01', '2026-02-28', '2026-02-15 00:00:00+10'),
  ('a0000000-0000-0000-0000-000000000004', 'subscription', 99.00,  '2026-02-01', '2026-02-28', '2026-02-01 00:00:00+10'),
  ('a0000000-0000-0000-0000-000000000004', 'beverage_sales', 35000.00, '2026-02-01', '2026-02-28', '2026-02-15 00:00:00+10'),
  ('a0000000-0000-0000-0000-000000000005', 'subscription', 199.00, '2026-02-01', '2026-02-28', '2026-02-01 00:00:00+10'),
  ('a0000000-0000-0000-0000-000000000005', 'catering_sales', 28000.00, '2026-02-01', '2026-02-28', '2026-02-15 00:00:00+10')
ON CONFLICT DO NOTHING;

-- ─── 8. AI Usage Log (for quota/billing views) ─────────────────────────────

INSERT INTO ai_usage_log (org_id, function_name, provider, model, input_tokens, output_tokens, total_tokens, cost_usd, latency_ms, created_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'chef-ai-chat',     'gemini', 'gemini-2.0-flash', 1200, 800,  2000,  0.000225, 1250, now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000001', 'chef-ai-chat',     'gemini', 'gemini-2.0-flash', 900,  600,  1500,  0.000169, 980,  now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000001', 'extract-recipe',   'gemini', 'gemini-2.0-flash', 3000, 2000, 5000,  0.000563, 3200, now() - interval '3 days'),
  ('a0000000-0000-0000-0000-000000000001', 'analyze-menu',     'gemini', 'gemini-2.0-flash', 5000, 3000, 8000,  0.000900, 4500, now() - interval '5 days'),
  ('a0000000-0000-0000-0000-000000000002', 'chef-ai-chat',     'gemini', 'gemini-2.0-flash', 2000, 1500, 3500,  0.000394, 1800, now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000002', 'chef-ai-chat',     'gemini', 'gemini-2.0-flash', 1800, 1200, 3000,  0.000338, 1500, now() - interval '3 days'),
  ('a0000000-0000-0000-0000-000000000002', 'extract-invoice',  'gemini', 'gemini-2.0-flash', 4000, 2500, 6500,  0.000731, 5600, now() - interval '4 days'),
  ('a0000000-0000-0000-0000-000000000004', 'bev-ai-chat',      'gemini', 'gemini-2.0-flash', 1500, 1000, 2500,  0.000281, 1100, now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000005', 'chef-ai-chat',     'gemini', 'gemini-2.0-flash', 2500, 1800, 4300,  0.000484, 2100, now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000005', 'generate-pnl-snapshot','gemini','gemini-2.0-flash',6000,4000,10000, 0.001125, 6800, now() - interval '6 days')
ON CONFLICT DO NOTHING;

-- ─── 9. Food Safety Logs ───────────────────────────────────────────────────

INSERT INTO food_safety_logs (id, org_id, log_type, readings, location, status, recorded_by_name, notes, date, time)
VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'temperature', '{"temperature":3.2,"label":"Walk-in Fridge AM Check"}',  'Walk-in Fridge',  'pass', 'Chef Marco', 'All within range',          CURRENT_DATE - 1, '06:00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'temperature', '{"temperature":3.5,"label":"Walk-in Fridge PM Check"}',  'Walk-in Fridge',  'pass', 'Chef Marco', 'Normal',                    CURRENT_DATE - 1, '14:00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'temperature', '{"temperature":-18.0,"label":"Freezer AM Check"}',       'Freezer',         'pass', 'Chef Marco', 'Stable',                    CURRENT_DATE - 1, '06:15'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'temperature', '{"temperature":72.0,"label":"Hot Hold - Soup"}',         'Service Counter', 'pass', 'Line Cook',  'French onion soup',         CURRENT_DATE,     '12:00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'cleaning',    '{"task":"Kitchen Deep Clean"}',                          'Full Kitchen',    'pass', 'Chef Marco', 'Weekly deep clean completed',CURRENT_DATE - 3, '22:00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'temperature', '{"temperature":1.5,"label":"Sushi Display Case"}',       'Sushi Bar',       'pass', 'Chef Yuki',  'Checked before service',    CURRENT_DATE,     '10:00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'temperature', '{"temperature":63.0,"label":"Rice Holding Temp"}',       'Rice Station',    'pass', 'Chef Yuki',  'Above 60C - safe',          CURRENT_DATE,     '11:00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'cleaning',    '{"task":"Sushi Bar Sanitise"}',                          'Sushi Bar',       'pass', 'Chef Yuki',  'Pre-service sanitisation',  CURRENT_DATE,     '09:30'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'temperature', '{"temperature":93.0,"label":"Coffee Machine Temp"}',     'Espresso Station','pass', 'Barista Sam','Brew temp optimal',         CURRENT_DATE,     '07:00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'temperature', '{"temperature":3.8,"label":"Milk Fridge"}',              'Under Counter',   'pass', 'Barista Sam','Within range',              CURRENT_DATE,     '07:15')
ON CONFLICT DO NOTHING;

-- ─── 10. Re-seed AI cost rates (wiped earlier) ─────────────────────────────

INSERT INTO ai_cost_rates (provider, model, input_cost_per_1k, output_cost_per_1k, image_cost_per_call, source)
VALUES
  ('gemini',    'gemini-2.0-flash',       0.000075, 0.000300, 0.000040, 'manual'),
  ('gemini',    'gemini-3-flash',         0.000075, 0.000300, 0.000040, 'manual'),
  ('openai',    'gpt-4o-mini',            0.000150, 0.000600, 0.000070, 'manual'),
  ('anthropic', 'claude-sonnet-4-20250514', 0.003000, 0.015000, 0.004800, 'manual')
ON CONFLICT (provider, model, effective_from) DO NOTHING;

-- ─── 11. Re-seed token quotas (wiped earlier) ──────────────────────────────

INSERT INTO ai_token_quotas (subscription_tier, product_key, monthly_tokens, ai_addon_bonus)
VALUES
  ('free',    'chefos', 50000,    0),
  ('premium', 'chefos', 500000,   250000),
  ('pro',     'chefos', 2000000,  1000000)
ON CONFLICT (subscription_tier, product_key) DO NOTHING;

-- ─── Done ──────────────────────────────────────────────────────────────────
