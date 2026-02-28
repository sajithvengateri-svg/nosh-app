
-- ═══════ Venue Spaces (zones/rooms for hire) ═══════
CREATE TABLE public.res_venue_spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  capacity_min INTEGER DEFAULT 1,
  capacity_max INTEGER DEFAULT 100,
  hire_type TEXT NOT NULL DEFAULT 'ZONE' CHECK (hire_type IN ('WHOLE_VENUE', 'ZONE')),
  room_hire_fee NUMERIC(10,2) DEFAULT 0,
  minimum_spend NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.res_venue_spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view venue spaces" ON public.res_venue_spaces
  FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org owners can manage venue spaces" ON public.res_venue_spaces
  FOR ALL USING (public.is_org_owner(auth.uid(), org_id));

-- ═══════ Function Clients CRM ═══════
CREATE TABLE public.res_function_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  total_events INTEGER DEFAULT 0,
  total_spend NUMERIC(12,2) DEFAULT 0,
  last_event_date DATE,
  pipeline_stage TEXT NOT NULL DEFAULT 'LEAD' CHECK (pipeline_stage IN ('LEAD', 'ENQUIRY', 'PROPOSAL_SENT', 'NEGOTIATION', 'CONFIRMED', 'COMPLETED', 'LOST')),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.res_function_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view function clients" ON public.res_function_clients
  FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org owners can manage function clients" ON public.res_function_clients
  FOR ALL USING (public.is_org_owner(auth.uid(), org_id));

-- ═══════ Function Proposals ═══════
CREATE TABLE public.res_function_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  function_id UUID REFERENCES public.res_functions(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.res_function_clients(id) ON DELETE SET NULL,
  proposal_number TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Event Proposal',
  cover_message TEXT,
  venue_space_id UUID REFERENCES public.res_venue_spaces(id) ON DELETE SET NULL,
  event_date DATE,
  start_time TIME,
  end_time TIME,
  party_size INTEGER DEFAULT 20,
  room_hire_fee NUMERIC(10,2) DEFAULT 0,
  minimum_spend NUMERIC(10,2) DEFAULT 0,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 10,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  deposit_schedule JSONB DEFAULT '[]',
  terms_and_conditions TEXT DEFAULT 'A 50% deposit is required to confirm your booking. The balance is due 7 days prior to the event. Cancellations within 14 days of the event will forfeit the deposit.',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  valid_until DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.res_function_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view proposals" ON public.res_function_proposals
  FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org owners can manage proposals" ON public.res_function_proposals
  FOR ALL USING (public.is_org_owner(auth.uid(), org_id));

-- ═══════ Proposal Menu Sections (editable menu card) ═══════
CREATE TABLE public.res_proposal_menu_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.res_function_proposals(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Menu Section',
  description TEXT,
  pricing_type TEXT NOT NULL DEFAULT 'PER_HEAD' CHECK (pricing_type IN ('PER_HEAD', 'FLAT', 'INCLUDED')),
  per_head_price NUMERIC(10,2) DEFAULT 0,
  flat_price NUMERIC(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.res_proposal_menu_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view proposal menu sections" ON public.res_proposal_menu_sections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.res_function_proposals p WHERE p.id = proposal_id AND public.is_org_member(auth.uid(), p.org_id))
  );
CREATE POLICY "Org owners can manage proposal menu sections" ON public.res_proposal_menu_sections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.res_function_proposals p WHERE p.id = proposal_id AND public.is_org_owner(auth.uid(), p.org_id))
  );

-- ═══════ CRM Activity Notes ═══════
CREATE TABLE public.res_function_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.res_function_clients(id) ON DELETE CASCADE,
  function_id UUID REFERENCES public.res_functions(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'NOTE' CHECK (note_type IN ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'FOLLOW_UP')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.res_function_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view function notes" ON public.res_function_notes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.res_function_clients c WHERE c.id = client_id AND public.is_org_member(auth.uid(), c.org_id))
    OR EXISTS (SELECT 1 FROM public.res_functions f WHERE f.id = function_id AND public.is_org_member(auth.uid(), f.org_id))
  );
CREATE POLICY "Org owners can manage function notes" ON public.res_function_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.res_function_clients c WHERE c.id = client_id AND public.is_org_owner(auth.uid(), c.org_id))
    OR EXISTS (SELECT 1 FROM public.res_functions f WHERE f.id = function_id AND public.is_org_owner(auth.uid(), f.org_id))
  );

-- Add client_id to existing functions table
ALTER TABLE public.res_functions ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.res_function_clients(id) ON DELETE SET NULL;
ALTER TABLE public.res_functions ADD COLUMN IF NOT EXISTS venue_space_id UUID REFERENCES public.res_venue_spaces(id) ON DELETE SET NULL;

-- Updated_at triggers
CREATE TRIGGER update_res_venue_spaces_updated_at BEFORE UPDATE ON public.res_venue_spaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_res_function_clients_updated_at BEFORE UPDATE ON public.res_function_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_res_function_proposals_updated_at BEFORE UPDATE ON public.res_function_proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_res_proposal_menu_sections_updated_at BEFORE UPDATE ON public.res_proposal_menu_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
