
-- Email templates table for editable welcome emails and future templates
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  variables jsonb DEFAULT '[]'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
ON public.email_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view email templates"
ON public.email_templates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the welcome email template
INSERT INTO public.email_templates (slug, name, subject, body_html, body_text, variables)
VALUES (
  'welcome-chef',
  'Welcome to ChefOS',
  'Welcome to ChefOS, {{chef_name}}! 🎉',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h1 style="color: #f97316;">Welcome to ChefOS, {{chef_name}}! 🎉</h1>
<p>Your kitchen just got smarter. Here''s what you can do right away:</p>
<ul>
<li>📝 <strong>Add your first recipe</strong> – digitise your signature dishes</li>
<li>📦 <strong>Set up inventory</strong> – track stock and costs in real-time</li>
<li>👥 <strong>Invite your team</strong> – assign roles and delegate prep lists</li>
<li>📊 <strong>Menu engineering</strong> – optimise your menu for profit</li>
</ul>
<p>Your organisation: <strong>{{org_name}}</strong></p>
<p><a href="{{app_url}}/dashboard" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open Your Dashboard →</a></p>
<p style="color: #666; font-size: 14px; margin-top: 30px;">Need help? Reply to this email or check our guides.</p>
<p style="color: #666; font-size: 12px;">— The ChefOS Team</p>
</div>',
  'Welcome to ChefOS, {{chef_name}}!

Your kitchen just got smarter. Here''s what you can do right away:
- Add your first recipe
- Set up inventory
- Invite your team
- Menu engineering

Your organisation: {{org_name}}

Open your dashboard: {{app_url}}/dashboard

— The ChefOS Team',
  '["chef_name", "org_name", "app_url", "referral_code"]'
);

-- Email send log for tracking
CREATE TABLE public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slug text NOT NULL,
  recipient_email text NOT NULL,
  recipient_user_id uuid,
  variables jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email logs"
ON public.email_send_log FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
