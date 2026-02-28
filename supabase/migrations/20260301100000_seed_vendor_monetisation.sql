-- Seed data for vendor monetisation flow
-- Creates test vendor user + profile + deals + deal codes + invoices
-- Run after 20260301000001_vendor_monetisation.sql

-- ─── 1. Create test auth user ────────────────────────────────────────────────
-- Password: testvendor123
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'demo-vendor@test.queitos.com',
  crypt('testvendor123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo Vendor"}',
  false, ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, provider,
  identity_data, last_sign_in_at, created_at, updated_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  'demo-vendor@test.queitos.com',
  'email',
  '{"sub":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001","email":"demo-vendor@test.queitos.com"}',
  now(), now(), now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- Consumer test user (who claims deals)
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'demo-consumer@test.queitos.com',
  crypt('testconsumer123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Sarah Chen"}',
  false, ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, provider,
  identity_data, last_sign_in_at, created_at, updated_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'demo-consumer@test.queitos.com',
  'email',
  '{"sub":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002","email":"demo-consumer@test.queitos.com"}',
  now(), now(), now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- Consumer profile (for first_name lookup in deal-redeem)
INSERT INTO profiles (id, full_name, email)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'Sarah Chen',
  'demo-consumer@test.queitos.com'
) ON CONFLICT (id) DO UPDATE SET full_name = 'Sarah Chen';

-- ─── 2. Vendor profile ──────────────────────────────────────────────────────

INSERT INTO vendor_profiles (
  id, user_id, business_name, abn,
  contact_name, contact_email, contact_phone,
  address, postcode, delivery_areas, categories,
  status, payment_status
) VALUES (
  'vvvvvvvv-0001-0001-0001-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  'Green Valley Produce',
  '12345678901',
  'Tom Green',
  'tom@greenvalley.com.au',
  '0412345678',
  '42 Market Lane, Paddington',
  '4064',
  ARRAY['4000','4064','4066','4101'],
  ARRAY['Fruit & Veg','Herbs','Dairy'],
  'approved',
  'good'
) ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  payment_status = EXCLUDED.payment_status;

-- ─── 3. Vendor deals ────────────────────────────────────────────────────────

-- Active deal: 20% off produce
INSERT INTO vendor_deals (
  id, vendor_id, title, description,
  discount_percent, min_order_value,
  applicable_categories, start_date, end_date, is_active
) VALUES (
  'dddddddd-0001-0001-0001-000000000001',
  'vvvvvvvv-0001-0001-0001-000000000001',
  '20% Off All Produce',
  'Fresh seasonal produce direct from Green Valley. Minimum $30 order.',
  20, 30,
  ARRAY['Fruit & Veg','Herbs'],
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '21 days',
  true
) ON CONFLICT (id) DO NOTHING;

-- Active deal: Free delivery
INSERT INTO vendor_deals (
  id, vendor_id, title, description,
  discount_amount, min_order_value,
  applicable_categories, start_date, end_date, is_active
) VALUES (
  'dddddddd-0001-0001-0001-000000000002',
  'vvvvvvvv-0001-0001-0001-000000000001',
  'Free Delivery Over $50',
  'Free next-day delivery on orders over $50. Brisbane metro only.',
  15, 50,
  ARRAY['Fruit & Veg','Herbs','Dairy'],
  CURRENT_DATE - INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '28 days',
  true
) ON CONFLICT (id) DO NOTHING;

-- Expired deal
INSERT INTO vendor_deals (
  id, vendor_id, title, description,
  discount_percent, min_order_value,
  applicable_categories, start_date, end_date, is_active
) VALUES (
  'dddddddd-0001-0001-0001-000000000003',
  'vvvvvvvv-0001-0001-0001-000000000001',
  'Launch Special 30% Off',
  'Grand opening discount on all items.',
  30, null,
  ARRAY['Fruit & Veg','Herbs','Dairy'],
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '2 days',
  false
) ON CONFLICT (id) DO NOTHING;

-- ─── 4. Deal codes (the key monetisation table) ─────────────────────────────

-- Active code: ready to be scanned (this is what the vendor will scan!)
INSERT INTO deal_codes (
  id, code, deal_id, vendor_id, user_id,
  status, claimed_at, expires_at
) VALUES (
  'cccccccc-0001-0001-0001-000000000001',
  'A8X4N2P9',
  'dddddddd-0001-0001-0001-000000000001',
  'vvvvvvvv-0001-0001-0001-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'active',
  now() - INTERVAL '2 hours',
  now() + INTERVAL '22 hours'
) ON CONFLICT (id) DO NOTHING;

-- Another active code for free delivery deal
INSERT INTO deal_codes (
  id, code, deal_id, vendor_id, user_id,
  status, claimed_at, expires_at
) VALUES (
  'cccccccc-0001-0001-0001-000000000002',
  'K7M3R5W2',
  'dddddddd-0001-0001-0001-000000000002',
  'vvvvvvvv-0001-0001-0001-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'active',
  now() - INTERVAL '1 hour',
  now() + INTERVAL '23 hours'
) ON CONFLICT (id) DO NOTHING;

-- Redeemed codes (historical — shows up in feed)
INSERT INTO deal_codes (
  id, code, deal_id, vendor_id, user_id,
  status, claimed_at, expires_at, redeemed_at,
  scanned_by, transaction_amount
) VALUES
(
  'cccccccc-0001-0001-0001-000000000010',
  'T5B8Y3H6',
  'dddddddd-0001-0001-0001-000000000001',
  'vvvvvvvv-0001-0001-0001-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'redeemed',
  now() - INTERVAL '3 days',
  now() - INTERVAL '2 days 23 hours',
  now() - INTERVAL '2 days 22 hours',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  42.50
),
(
  'cccccccc-0001-0001-0001-000000000011',
  'F9G2L4X7',
  'dddddddd-0001-0001-0001-000000000001',
  'vvvvvvvv-0001-0001-0001-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'redeemed',
  now() - INTERVAL '2 days',
  now() - INTERVAL '1 day 23 hours',
  now() - INTERVAL '1 day 20 hours',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  67.80
),
(
  'cccccccc-0001-0001-0001-000000000012',
  'P4C8N6J2',
  'dddddddd-0001-0001-0001-000000000002',
  'vvvvvvvv-0001-0001-0001-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'redeemed',
  now() - INTERVAL '1 day',
  now() - INTERVAL '23 hours',
  now() - INTERVAL '18 hours',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  55.00
),
(
  'cccccccc-0001-0001-0001-000000000013',
  'R7W3V5M8',
  'dddddddd-0001-0001-0001-000000000001',
  'vvvvvvvv-0001-0001-0001-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'redeemed',
  now() - INTERVAL '5 hours',
  now() - INTERVAL '4 hours',
  now() - INTERVAL '3 hours',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  38.90
),
(
  'cccccccc-0001-0001-0001-000000000014',
  'D6H9S2E4',
  'dddddddd-0001-0001-0001-000000000001',
  'vvvvvvvv-0001-0001-0001-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'redeemed',
  now() - INTERVAL '6 days',
  now() - INTERVAL '5 days 23 hours',
  now() - INTERVAL '5 days 20 hours',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
  88.20
)
ON CONFLICT (id) DO NOTHING;

-- Expired code
INSERT INTO deal_codes (
  id, code, deal_id, vendor_id, user_id,
  status, claimed_at, expires_at
) VALUES (
  'cccccccc-0001-0001-0001-000000000020',
  'Q3Z7U5A9',
  'dddddddd-0001-0001-0001-000000000001',
  'vvvvvvvv-0001-0001-0001-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
  'expired',
  now() - INTERVAL '3 days',
  now() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- ─── 5. Invoice (last week's usage) ─────────────────────────────────────────

INSERT INTO vendor_invoices (
  id, vendor_id, invoice_type,
  period_start, period_end,
  redemption_count, tracked_sales_total,
  usage_fee_amount, gst_amount, total_amount,
  status, issued_at, due_at
) VALUES (
  'iiiiiiii-0001-0001-0001-000000000001',
  'vvvvvvvv-0001-0001-0001-000000000001',
  'usage',
  (CURRENT_DATE - INTERVAL '14 days')::date,
  (CURRENT_DATE - INTERVAL '7 days')::date,
  3, 198.50,
  3.97, 0.40, 4.37,
  'paid',
  now() - INTERVAL '7 days',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Current week draft invoice
INSERT INTO vendor_invoices (
  id, vendor_id, invoice_type,
  period_start, period_end,
  redemption_count, tracked_sales_total,
  usage_fee_amount, gst_amount, total_amount,
  status, issued_at, due_at
) VALUES (
  'iiiiiiii-0001-0001-0001-000000000002',
  'vvvvvvvv-0001-0001-0001-000000000001',
  'usage',
  (CURRENT_DATE - INTERVAL '7 days')::date,
  CURRENT_DATE,
  5, 292.40,
  5.85, 0.59, 6.44,
  'draft',
  now(),
  now() + INTERVAL '7 days'
) ON CONFLICT (id) DO NOTHING;

-- ─── Summary ─────────────────────────────────────────────────────────────────
-- Vendor login: demo-vendor@test.queitos.com / testvendor123
--
-- What you'll see:
-- Dashboard: Usage summary (5 customers, $292.40 tracked, $6.44 cost, 45x ROI)
--            Redemption feed (5 recent scans)
-- Deals tab: 3 deals (2 active, 1 expired)
-- Scan tab:  Scan code A8X4N2P9 or K7M3R5W2 to test flow
--            Or type manually: A8X4N2P9
-- Settings:  Billing section with Payment Method + Invoices
-- Invoices:  2 invoices (1 paid, 1 draft)
