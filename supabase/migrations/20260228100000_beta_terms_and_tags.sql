-- ============================================================================
-- Beta Preparation: Terms Acceptance + User Tags
-- ============================================================================

-- ─── 1. Add accepted_terms_at to profiles ──────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;

-- ─── 2. Add tags array to profiles (for beta_tester, etc.) ────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- ─── 3. Seed Terms & Conditions page ───────────────────────────────────────
INSERT INTO site_pages (slug, title, body_html, body_text, is_published)
VALUES (
  'terms',
  'Terms & Conditions',
  '<h1>ChefOS — Terms &amp; Conditions</h1>
<p><strong>Effective Date:</strong> 28 February 2026</p>
<p><strong>Last Updated:</strong> 28 February 2026</p>

<h2>1. Beta Programme</h2>
<p>ChefOS is currently in <strong>beta</strong>. By accessing or using the platform you acknowledge that:</p>
<ul>
  <li>Features may be incomplete, modified, or removed without notice.</li>
  <li>Data stored during the beta period <strong>may be reset</strong> at any time.</li>
  <li>The service is provided <strong>"as is"</strong> without warranty of any kind.</li>
  <li>We may terminate or restrict access at our sole discretion.</li>
</ul>

<h2>2. Accounts &amp; Access</h2>
<p>You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old (or the legal age of majority in your jurisdiction) to create an account. One person per account — sharing credentials is not permitted.</p>

<h2>3. Acceptable Use</h2>
<p>You agree <strong>not</strong> to:</p>
<ul>
  <li>Reverse-engineer, decompile, or attempt to extract the source code.</li>
  <li>Use the platform for any unlawful purpose.</li>
  <li>Upload content that infringes third-party intellectual property.</li>
  <li>Attempt to gain unauthorised access to other users'' data or system infrastructure.</li>
</ul>

<h2>4. Intellectual Property</h2>
<p>All content, design, code, and branding are the property of ChefOS Pty Ltd (or its licensors). You retain ownership of data you upload but grant us a licence to process it for delivering the service.</p>

<h2>5. Data &amp; Privacy</h2>
<p>Your data is handled in accordance with our <a href="/privacy">Privacy Policy</a>. During the beta period, we may collect additional usage analytics to improve the product. We will never sell your personal information to third parties.</p>

<h2>6. Limitation of Liability</h2>
<p>To the maximum extent permitted by law, ChefOS shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunity, arising from your use of the platform.</p>

<h2>7. Changes to Terms</h2>
<p>We may update these terms at any time. Continued use after changes constitutes acceptance of the revised terms. We will notify you of material changes via email or in-app notification.</p>

<h2>8. Termination</h2>
<p>We may suspend or terminate your access at any time for violation of these terms. You may delete your account at any time through Settings.</p>

<h2>9. Governing Law</h2>
<p>These terms are governed by the laws of Queensland, Australia. Any disputes shall be resolved in the courts of Queensland.</p>

<h2>10. Contact</h2>
<p>Questions? Contact us at <strong>hello@chefos.app</strong>.</p>',
  'ChefOS Terms & Conditions. Beta programme disclaimer. Accounts, acceptable use, IP, data privacy, limitation of liability, termination, governing law.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  is_published = EXCLUDED.is_published,
  updated_at = now();

-- ─── 4. Seed Privacy Policy page ──────────────────────────────────────────
INSERT INTO site_pages (slug, title, body_html, body_text, is_published)
VALUES (
  'privacy',
  'Privacy Policy',
  '<h1>ChefOS — Privacy Policy</h1>
<p><strong>Effective Date:</strong> 28 February 2026</p>

<h2>1. Information We Collect</h2>
<p>We collect the following when you use ChefOS:</p>
<ul>
  <li><strong>Account information:</strong> Name, email address, organisation name.</li>
  <li><strong>Usage data:</strong> Pages visited, features used, timestamps, device type.</li>
  <li><strong>Content you create:</strong> Recipes, menus, inventory entries, financial data, food safety records.</li>
  <li><strong>Authentication data:</strong> Managed by Supabase Auth (passwords are hashed and never stored in plain text).</li>
</ul>

<h2>2. How We Use Your Data</h2>
<ul>
  <li>To provide and improve the ChefOS platform.</li>
  <li>To personalise your experience (AI-powered features, recommendations).</li>
  <li>To send service-related notifications (onboarding emails, alerts).</li>
  <li>To generate aggregate, anonymised analytics for product improvement.</li>
</ul>

<h2>3. Third-Party Services</h2>
<p>We use the following third-party services that may process your data:</p>
<ul>
  <li><strong>Supabase</strong> — Database hosting, authentication, file storage (hosted in AWS Sydney region).</li>
  <li><strong>Vercel</strong> — Web application hosting.</li>
  <li><strong>Google OAuth</strong> — Optional sign-in method. Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google''s Privacy Policy</a>.</li>
  <li><strong>Apple Sign-In</strong> — Optional sign-in method. Subject to <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener">Apple''s Privacy Policy</a>.</li>
  <li><strong>Stripe</strong> — Payment processing (if/when billing is enabled). Subject to <a href="https://stripe.com/au/privacy" target="_blank" rel="noopener">Stripe''s Privacy Policy</a>.</li>
  <li><strong>AI Providers</strong> (Google Gemini, OpenAI, Anthropic) — For AI-powered features. Your data is sent to these providers for processing but is not used to train their models.</li>
</ul>

<h2>4. Cookies &amp; Local Storage</h2>
<p>We use browser local storage and session storage for authentication tokens and user preferences. We do not use third-party tracking cookies.</p>

<h2>5. Data Retention</h2>
<p>During the beta period, data may be retained until the beta concludes or your account is deleted. You can request data export or deletion by contacting us.</p>

<h2>6. Data Security</h2>
<p>We implement industry-standard security measures including:</p>
<ul>
  <li>TLS encryption for all data in transit.</li>
  <li>Row Level Security (RLS) policies ensuring users can only access their own organisation''s data.</li>
  <li>Regular security reviews of our infrastructure.</li>
</ul>

<h2>7. Your Rights</h2>
<p>You have the right to:</p>
<ul>
  <li>Access, correct, or delete your personal data.</li>
  <li>Export your data in a machine-readable format.</li>
  <li>Withdraw consent for optional data processing.</li>
  <li>Lodge a complaint with a relevant data protection authority.</li>
</ul>

<h2>8. Children</h2>
<p>ChefOS is not intended for users under 18. We do not knowingly collect data from minors.</p>

<h2>9. Changes</h2>
<p>We may update this policy periodically. We will notify you of material changes.</p>

<h2>10. Contact</h2>
<p>For privacy inquiries: <strong>hello@chefos.app</strong></p>',
  'ChefOS Privacy Policy. Information collection, usage, third-party services, cookies, data retention, security, your rights.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  is_published = EXCLUDED.is_published,
  updated_at = now();
