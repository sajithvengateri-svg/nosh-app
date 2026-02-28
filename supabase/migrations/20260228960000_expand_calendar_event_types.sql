-- Expand calendar_events event_type to include all app types
ALTER TABLE public.calendar_events
  DROP CONSTRAINT IF EXISTS calendar_events_event_type_check;

ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_event_type_check
  CHECK (event_type IN (
    'meeting', 'inspection', 'training', 'delivery',
    'maintenance', 'license', 'interview', 'fetch_call',
    'event', 'other'
  ));
