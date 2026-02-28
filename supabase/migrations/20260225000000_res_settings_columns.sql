-- Add missing settings columns for pre-theatre, weather, and voice agent

-- Pre-theatre dining
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS pre_theatre_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS pre_theatre_bill_lead_minutes int NOT NULL DEFAULT 5;
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS pre_theatre_turn_time int NOT NULL DEFAULT 90;
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS pre_theatre_ask_in_widget boolean NOT NULL DEFAULT true;
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS pre_theatre_max_sessions int NOT NULL DEFAULT 6;
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS pre_theatre_data_source text NOT NULL DEFAULT 'manual';

-- Weather assistance
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS weather_nudge_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS widget_weather_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS weather_auto_block_suggest boolean NOT NULL DEFAULT true;
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS weather_rain_threshold int NOT NULL DEFAULT 40;
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS weather_temp_threshold int NOT NULL DEFAULT 35;

-- Voice agent
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS voice_agent_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS vapi_api_key text DEFAULT '';
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS vapi_assistant_id text DEFAULT '';
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS vapi_phone_number text DEFAULT '';

-- Update the public view to expose pre-theatre + weather settings for the widget
CREATE OR REPLACE VIEW public.res_settings_public AS
SELECT org_id, operating_hours, service_periods,
       pre_theatre_enabled, pre_theatre_ask_in_widget,
       widget_weather_enabled
FROM public.res_settings;

GRANT SELECT ON public.res_settings_public TO anon, authenticated;
