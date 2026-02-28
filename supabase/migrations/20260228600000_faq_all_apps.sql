-- Add FAQ entries for all app modules (BevOS, RestOS, LabourOS, MoneyOS, ReservationOS, OverheadOS, GrowthOS, ClockOS, SupplyOS)

-- ── BevOS FAQs ──
INSERT INTO public.help_articles (module, page, title, subtitle, icon, category, steps, tags, sort_order, is_published) VALUES
('bevos', 'faq', 'What is BevOS?', 'Overview of the beverage management suite', 'Wine', 'faq',
 '[{"step_number":1,"title":"BevOS overview","instruction":"BevOS is your complete beverage management suite. It covers wine cellar management, cocktail spec building with costings, draught and keg tracking, coffee and espresso dialling, bar prep lists, staff training flash cards, and AI-powered wine pairing suggestions.","tips":"Start with the module that matches your biggest pain point — most bars begin with cellar or cocktail specs."}]',
 ARRAY['bevos','beverage','wine','cocktails','bar','overview'], 200, true),

('bevos', 'faq', 'How do I cost a cocktail?', 'Build specs and hit your GP target', 'GlassWater', 'faq',
 '[{"step_number":1,"title":"Cocktail costing","instruction":"Go to Cocktails in BevOS and create a new spec. Add each ingredient with exact ml measurements. The cost per drink calculates automatically based on your ingredient prices. Set your sell price to hit your target GP% — aim for 80%+ on cocktails.","tips":"Use batch mode to scale recipes and print batch labels for your top sellers."}]',
 ARRAY['bevos','cocktail','costing','spec','gp','price'], 201, true),

('bevos', 'faq', 'Can BevOS track open bottles and Coravin pours?', 'Manage by-the-glass inventory', 'Wine', 'faq',
 '[{"step_number":1,"title":"Open bottle tracking","instruction":"Yes. When you open a bottle in the cellar, tap Open to start tracking remaining ml and expiry. Coravin-preserved wines are tracked separately with extended shelf life. This helps you manage by-the-glass service and reduce waste from expired open bottles.","tips":"Weigh open bottles during stocktake for accurate partial counts."}]',
 ARRAY['bevos','wine','coravin','open','bottle','glass','inventory'], 202, true);

-- ── RestOS FAQs ──
INSERT INTO public.help_articles (module, page, title, subtitle, icon, category, steps, tags, sort_order, is_published) VALUES
('restos', 'faq', 'What is RestOS?', 'Overview of the restaurant operations suite', 'Monitor', 'faq',
 '[{"step_number":1,"title":"RestOS overview","instruction":"RestOS handles your front-of-house operations. It includes a point-of-sale system, kitchen display system (KDS) with smart ticket routing, bar tab management, sales analytics and reporting, and menu administration with modifier groups.","tips":"Set up your menu items and KDS stations first — everything else flows from there."}]',
 ARRAY['restos','restaurant','pos','kds','overview'], 300, true),

('restos', 'faq', 'How does the Kitchen Display System work?', 'Ticket routing, timers, and bumping', 'LayoutGrid', 'faq',
 '[{"step_number":1,"title":"KDS workflow","instruction":"When an order is sent from POS, items route automatically to the correct kitchen station based on your setup. Tickets are colour-coded by urgency: green means on time, amber is a warning, and red means overdue. Tap a ticket to bump it to the pass screen when ready. Double-tap for partial bumps.","tips":"Set ticket target times per category — for example 8 minutes for starters and 15 minutes for mains."}]',
 ARRAY['restos','kds','kitchen','display','tickets','timer'], 301, true),

('restos', 'faq', 'Can I split bills on the POS?', 'Flexible payment options', 'CreditCard', 'faq',
 '[{"step_number":1,"title":"Bill splitting","instruction":"Yes. When processing payment, tap Pay and choose your split method — you can split by item (each person pays for what they ordered) or by equal share (total divided evenly). The POS supports cash, card, and mixed payment methods. Receipts can be printed or emailed.","tips":"Star your top 10 menu items for the quick-access bar to speed up ordering."}]',
 ARRAY['restos','pos','split','bill','payment'], 302, true);

-- ── LabourOS FAQs ──
INSERT INTO public.help_articles (module, page, title, subtitle, icon, category, steps, tags, sort_order, is_published) VALUES
('labouros', 'faq', 'What is LabourOS?', 'Overview of workforce management', 'Calendar', 'faq',
 '[{"step_number":1,"title":"LabourOS overview","instruction":"LabourOS manages your entire workforce lifecycle. Build rosters with templates and auto-fill, track timesheets with approval workflows, run payroll with award interpretation, and stay compliant with break tracking and certificate management.","tips":"Aim for 28-32% labour cost when building rosters."}]',
 ARRAY['labouros','labour','roster','payroll','overview'], 400, true),

('labouros', 'faq', 'How do I publish a roster?', 'Creating and sharing staff schedules', 'Calendar', 'faq',
 '[{"step_number":1,"title":"Publishing rosters","instruction":"Go to Roster in LabourOS, select the week, and build shifts by dragging time slots or using a template. Assign staff based on availability and skills. Check the labour cost percentage as you build. When ready, tap Publish — staff get notified of their shifts via the app.","tips":"Publish at least 7 days ahead to comply with most awards."}]',
 ARRAY['labouros','roster','publish','schedule','shifts'], 401, true),

('labouros', 'faq', 'Does LabourOS handle award interpretation?', 'Automatic penalty rates and overtime', 'DollarSign', 'faq',
 '[{"step_number":1,"title":"Award interpretation","instruction":"Yes. When you create a pay run, LabourOS automatically calculates base pay, overtime, penalty rates, and allowances based on the applicable award. Review each employee''s pay breakdown before exporting to your payroll system.","tips":"Keep payroll records for 7 years as required by law."}]',
 ARRAY['labouros','payroll','award','overtime','penalty','wages'], 402, true);

-- ── MoneyOS FAQs ──
INSERT INTO public.help_articles (module, page, title, subtitle, icon, category, steps, tags, sort_order, is_published) VALUES
('moneyos', 'faq', 'What is MoneyOS?', 'Overview of the financial intelligence suite', 'Atom', 'faq',
 '[{"step_number":1,"title":"MoneyOS overview","instruction":"MoneyOS is your financial hub. The Reactor dashboard shows real-time pulse metrics and cross-product correlations. It includes a live P&L with waterfall charts, a what-if simulator with Monte Carlo analysis, forensic audit for true cost analysis, and a 7-module health score.","tips":"Start with the Reactor dashboard to get an instant read on your business health."}]',
 ARRAY['moneyos','money','finance','reactor','pnl','overview'], 500, true),

('moneyos', 'faq', 'What is the Quiet Audit Score?', 'Understanding your 7-module health score', 'ShieldCheck', 'faq',
 '[{"step_number":1,"title":"Quiet Audit Score","instruction":"Your Quiet Audit score is a weighted average across 7 modules: Labour, Overhead, Food, Service, Beverage, Marketing, and Compliance. A score above 80 is Good, 60-80 is Fair, and below 60 needs urgent attention. Tap each module to see sub-scores and specific recommendations.","tips":"Focus on the lowest-scoring module first for maximum impact. Track weekly for consistent improvement."}]',
 ARRAY['moneyos','audit','score','health','modules'], 501, true),

('moneyos', 'faq', 'How does the What-If Simulator work?', 'Run scenarios and forecast outcomes', 'FlaskConical', 'faq',
 '[{"step_number":1,"title":"What-If Simulator","instruction":"Set up a scenario by changing a variable — for example: what happens if food cost rises 3%, if you add 10 covers per night, or if you cut one staff member. The simulator runs 1000+ Monte Carlo scenarios with random variations and shows you the probability distribution of outcomes.","tips":"Change one variable at a time for clear insights. Focus on the 10th percentile — that is your downside risk."}]',
 ARRAY['moneyos','simulator','what-if','monte-carlo','scenario','forecast'], 502, true);

-- ── ReservationOS FAQs ──
INSERT INTO public.help_articles (module, page, title, subtitle, icon, category, steps, tags, sort_order, is_published) VALUES
('reservationos', 'faq', 'What is ReservationOS?', 'Overview of the reservation and guest management suite', 'CalendarDays', 'faq',
 '[{"step_number":1,"title":"ReservationOS overview","instruction":"ReservationOS handles bookings, floor plans, guest CRM, and event management. Take reservations via phone, the online widget, or walk-ins. Manage table assignments on a digital floor plan, build guest profiles with preferences and visit history, and coordinate functions with proposals and BEOs.","tips":"Set up your floor plan first to match your physical layout — everything else builds on it."}]',
 ARRAY['reservationos','reservation','booking','guest','overview'], 600, true),

('reservationos', 'faq', 'Can guests book online?', 'Website booking widget', 'Globe', 'faq',
 '[{"step_number":1,"title":"Online booking widget","instruction":"Yes. ReservationOS includes an embeddable booking widget for your website. Guests can see available time slots, select party size, and book directly. The widget checks your floor plan availability in real-time and supports an AI chat agent for guest questions.","tips":"Customise the widget colours and welcome message to match your brand in Widget Config."}]',
 ARRAY['reservationos','widget','online','booking','website'], 601, true),

('reservationos', 'faq', 'How do I manage VIP guests?', 'Guest profiles and preferences', 'Users', 'faq',
 '[{"step_number":1,"title":"VIP guest management","instruction":"Each guest has a profile with visit history, total spend, dietary requirements, and personal preferences. Mark guests as VIP and they get a gold star badge on their bookings. Add notes after each visit about what they enjoyed and any special occasions. Use pre-shift briefings to share tonight''s VIP notes with your team.","tips":"Track allergies and dietary requirements carefully — this is both a safety and service issue."}]',
 ARRAY['reservationos','vip','guest','crm','preferences','profile'], 602, true);

-- ── OverheadOS FAQs ──
INSERT INTO public.help_articles (module, page, title, subtitle, icon, category, steps, tags, sort_order, is_published) VALUES
('overheados', 'faq', 'What is OverheadOS?', 'Overview of overhead cost management', 'Building2', 'faq',
 '[{"step_number":1,"title":"OverheadOS overview","instruction":"OverheadOS helps you categorise, track, and benchmark your overhead costs — rent, utilities, insurance, repairs, marketing, admin, and more. It includes break-even analysis so you always know the daily revenue target needed to cover your fixed costs.","tips":"Total overheads should be 15-25% of revenue. If you are above that, investigate the biggest category first."}]',
 ARRAY['overheados','overhead','costs','rent','utilities','overview'], 700, true),

('overheados', 'faq', 'How do I calculate my break-even point?', 'Daily revenue target to cover fixed costs', 'Target', 'faq',
 '[{"step_number":1,"title":"Break-even calculation","instruction":"Go to Break-Even in OverheadOS and enter all your fixed costs: rent, insurance, loan repayments, salaried staff, and any other costs that do not change with volume. The system calculates your daily break-even in both dollars and covers based on your average ticket size.","tips":"Know this number by heart — it is the most important number in your business."}]',
 ARRAY['overheados','breakeven','fixed-costs','target','revenue'], 701, true);

-- ── GrowthOS FAQs ──
INSERT INTO public.help_articles (module, page, title, subtitle, icon, category, steps, tags, sort_order, is_published) VALUES
('growthos', 'faq', 'What is GrowthOS?', 'Overview of marketing and growth tools', 'Megaphone', 'faq',
 '[{"step_number":1,"title":"GrowthOS overview","instruction":"GrowthOS gives you marketing campaign management and customer segmentation tools. Create, schedule, and track campaigns across channels. Build targeted audiences using RFM analysis (Recency, Frequency, Monetary value) and send personalised offers to specific customer segments.","tips":"Start with one channel and expand based on results. Personalised messages get 3x higher response rates."}]',
 ARRAY['growthos','growth','marketing','campaigns','segments','overview'], 800, true),

('growthos', 'faq', 'How do I create a marketing campaign?', 'Campaign setup and tracking', 'Megaphone', 'faq',
 '[{"step_number":1,"title":"Creating campaigns","instruction":"Go to Campaigns in GrowthOS and tap New. Set the objective, target audience, channels, and budget. Once live, monitor reach, engagement, conversions, and ROI in real-time. Use A/B testing to optimise your messaging.","tips":"Target specific customer segments rather than blasting everyone — you will get better results with less spend."}]',
 ARRAY['growthos','campaign','create','marketing','roi'], 801, true);

-- ── ClockOS FAQs ──
INSERT INTO public.help_articles (module, page, title, subtitle, icon, category, steps, tags, sort_order, is_published) VALUES
('clockos', 'faq', 'What is ClockOS?', 'Overview of time and attendance tracking', 'Clock', 'faq',
 '[{"step_number":1,"title":"ClockOS overview","instruction":"ClockOS is a simple time and attendance system. Staff clock in and out using a PIN with photo verification. Managers see a live dashboard of who is currently working, shift durations, and approaching overtime. Geo-fencing prevents remote clock-ins.","tips":"Set the geo-fence radius to 100m around your venue for reliable check-ins."}]',
 ARRAY['clockos','clock','time','attendance','overview'], 900, true),

('clockos', 'faq', 'How does geo-fencing work for clock-ins?', 'Location-based attendance verification', 'MapPin', 'faq',
 '[{"step_number":1,"title":"Geo-fencing","instruction":"Set up clock-in devices (tablets or phones) with geo-fencing enabled in ClockOS settings. Define your venue location and radius. Staff can only clock in when their device is within the geo-fence boundary, preventing remote or fraudulent clock-ins.","tips":"A 100m radius works well for most venues. Increase it if your venue has a large property or outdoor areas."}]',
 ARRAY['clockos','geofence','location','clock','device'], 901, true);

-- ── SupplyOS FAQs ──
INSERT INTO public.help_articles (module, page, title, subtitle, icon, category, steps, tags, sort_order, is_published) VALUES
('supplyos', 'faq', 'What is SupplyOS?', 'Overview of supply chain and ordering', 'ShoppingCart', 'faq',
 '[{"step_number":1,"title":"SupplyOS overview","instruction":"SupplyOS streamlines your supply chain. It suggests order quantities based on par levels, current stock, and upcoming bookings. Place orders directly to suppliers, compare prices across vendors, and set alerts for price changes or better deals.","tips":"Review and place orders on the same day each week for consistency."}]',
 ARRAY['supplyos','supply','orders','purchasing','overview'], 1000, true),

('supplyos', 'faq', 'Can I compare prices across suppliers?', 'Price Watch and deal finding', 'Eye', 'faq',
 '[{"step_number":1,"title":"Price comparison","instruction":"Yes. The Price Watch feature shows the same product across multiple suppliers, sorted by price, delivery time, or minimum order. Set alerts to get notified when prices change significantly or when better deals become available in the marketplace.","tips":"Price is not everything — consider quality, reliability, and minimum order quantities when choosing suppliers."}]',
 ARRAY['supplyos','price','comparison','supplier','deals'], 1001, true);
