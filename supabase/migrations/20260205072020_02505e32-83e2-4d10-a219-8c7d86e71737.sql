-- Add 'admin' to the app_role enum for Control Center access
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';