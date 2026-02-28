-- =====================
-- RECIPES TABLE
-- =====================
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Main',
    prep_time INTEGER DEFAULT 0,
    cook_time INTEGER DEFAULT 0,
    servings INTEGER DEFAULT 1,
    ingredients JSONB DEFAULT '[]'::jsonb,
    instructions JSONB DEFAULT '[]'::jsonb,
    allergens TEXT[] DEFAULT '{}',
    cost_per_serving DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- INGREDIENTS TABLE
-- =====================
CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    unit TEXT NOT NULL DEFAULT 'kg',
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    supplier TEXT,
    allergens TEXT[] DEFAULT '{}',
    par_level DECIMAL(10,2) DEFAULT 0,
    current_stock DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- INVENTORY TABLE
-- =====================
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kg',
    location TEXT DEFAULT 'Main Storage',
    expiry_date DATE,
    batch_number TEXT,
    received_date DATE DEFAULT CURRENT_DATE,
    min_stock DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- PREP LISTS TABLE
-- =====================
CREATE TABLE public.prep_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    items JSONB DEFAULT '[]'::jsonb,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- ALLERGENS TABLE
-- =====================
CREATE TABLE public.allergens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'AlertTriangle',
    color TEXT DEFAULT 'red',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default allergens
INSERT INTO public.allergens (name, icon, color, description) VALUES
('Gluten', 'Wheat', 'amber', 'Found in wheat, barley, rye'),
('Dairy', 'Milk', 'blue', 'Milk and milk products'),
('Eggs', 'Egg', 'yellow', 'Eggs and egg products'),
('Fish', 'Fish', 'cyan', 'All fish species'),
('Shellfish', 'Shell', 'orange', 'Crustaceans and mollusks'),
('Tree Nuts', 'TreeDeciduous', 'brown', 'Almonds, cashews, walnuts, etc.'),
('Peanuts', 'Bean', 'amber', 'Peanuts and peanut products'),
('Soy', 'Bean', 'green', 'Soybeans and soy products'),
('Sesame', 'Circle', 'yellow', 'Sesame seeds and oil'),
('Sulfites', 'FlaskConical', 'purple', 'Preservatives in wine, dried fruits'),
('Mustard', 'Circle', 'yellow', 'Mustard seeds and products'),
('Celery', 'Leaf', 'green', 'Celery and celeriac'),
('Lupin', 'Flower', 'purple', 'Lupin seeds and flour'),
('Mollusks', 'Shell', 'gray', 'Squid, octopus, snails');

-- =====================
-- CHEATSHEETS TABLE
-- =====================
CREATE TABLE public.cheatsheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    content TEXT NOT NULL,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- ROSTER TABLE
-- =====================
CREATE TABLE public.roster_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    position TEXT DEFAULT 'Line Cook',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- CALENDAR EVENTS TABLE
-- =====================
CREATE TABLE public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'maintenance' CHECK (event_type IN ('maintenance', 'license', 'inspection', 'training', 'other')),
    date DATE NOT NULL,
    time TIME,
    end_date DATE,
    description TEXT,
    location TEXT,
    recurring TEXT CHECK (recurring IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'due', 'overdue', 'completed')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- EQUIPMENT TABLE
-- =====================
CREATE TABLE public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    model TEXT,
    serial_number TEXT,
    manufacturer TEXT,
    purchase_date DATE,
    warranty_expiry DATE,
    location TEXT DEFAULT 'Kitchen',
    status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'needs_maintenance', 'out_of_service', 'retired')),
    maintenance_schedule TEXT,
    last_maintenance DATE,
    next_maintenance DATE,
    tech_contacts JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    manual_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- SUPPLIERS TABLE
-- =====================
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    products TEXT,
    rep_name TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    credit_status TEXT DEFAULT 'pending' CHECK (credit_status IN ('pending', 'applied', 'approved', 'done')),
    account_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- FOOD SAFETY LOGS TABLE
-- =====================
CREATE TABLE public.food_safety_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_type TEXT NOT NULL CHECK (log_type IN ('temperature', 'cleaning', 'delivery', 'pest_control', 'haccp', 'other')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME NOT NULL DEFAULT CURRENT_TIME,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recorded_by_name TEXT,
    readings JSONB DEFAULT '{}'::jsonb,
    location TEXT,
    status TEXT DEFAULT 'pass' CHECK (status IN ('pass', 'fail', 'warning')),
    corrective_action TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- TRAINING MATERIALS TABLE
-- =====================
CREATE TABLE public.training_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    content TEXT,
    file_url TEXT,
    video_url TEXT,
    duration_minutes INTEGER,
    required_for TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- TRAINING RECORDS TABLE
-- =====================
CREATE TABLE public.training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES public.training_materials(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    score INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, material_id)
);

-- =====================
-- ENABLE RLS ON ALL TABLES
-- =====================
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheatsheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_safety_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS POLICIES - All authenticated users can view, head chefs can manage
-- =====================

-- Recipes
CREATE POLICY "Anyone can view recipes" ON public.recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage recipes" ON public.recipes FOR ALL USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users with edit permission can manage recipes" ON public.recipes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.module_permissions WHERE user_id = auth.uid() AND module = 'recipes' AND can_edit = true)
);

-- Ingredients
CREATE POLICY "Anyone can view ingredients" ON public.ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage ingredients" ON public.ingredients FOR ALL USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users with edit permission can manage ingredients" ON public.ingredients FOR ALL USING (
    EXISTS (SELECT 1 FROM public.module_permissions WHERE user_id = auth.uid() AND module = 'ingredients' AND can_edit = true)
);

-- Inventory
CREATE POLICY "Anyone can view inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage inventory" ON public.inventory FOR ALL USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users with edit permission can manage inventory" ON public.inventory FOR ALL USING (
    EXISTS (SELECT 1 FROM public.module_permissions WHERE user_id = auth.uid() AND module = 'inventory' AND can_edit = true)
);

-- Prep Lists
CREATE POLICY "Anyone can view prep lists" ON public.prep_lists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage prep lists" ON public.prep_lists FOR ALL USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users with edit permission can manage prep lists" ON public.prep_lists FOR ALL USING (
    EXISTS (SELECT 1 FROM public.module_permissions WHERE user_id = auth.uid() AND module = 'prep' AND can_edit = true)
);

-- Allergens
CREATE POLICY "Anyone can view allergens" ON public.allergens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage allergens" ON public.allergens FOR ALL USING (public.is_head_chef(auth.uid()));

-- Cheatsheets
CREATE POLICY "Anyone can view cheatsheets" ON public.cheatsheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage cheatsheets" ON public.cheatsheets FOR ALL USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users with edit permission can manage cheatsheets" ON public.cheatsheets FOR ALL USING (
    EXISTS (SELECT 1 FROM public.module_permissions WHERE user_id = auth.uid() AND module = 'cheatsheets' AND can_edit = true)
);

-- Roster
CREATE POLICY "Anyone can view roster" ON public.roster_shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage roster" ON public.roster_shifts FOR ALL USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users with edit permission can manage roster" ON public.roster_shifts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.module_permissions WHERE user_id = auth.uid() AND module = 'roster' AND can_edit = true)
);

-- Calendar
CREATE POLICY "Anyone can view calendar" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage calendar" ON public.calendar_events FOR ALL USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users with edit permission can manage calendar" ON public.calendar_events FOR ALL USING (
    EXISTS (SELECT 1 FROM public.module_permissions WHERE user_id = auth.uid() AND module = 'calendar' AND can_edit = true)
);

-- Equipment
CREATE POLICY "Anyone can view equipment" ON public.equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage equipment" ON public.equipment FOR ALL USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users with edit permission can manage equipment" ON public.equipment FOR ALL USING (
    EXISTS (SELECT 1 FROM public.module_permissions WHERE user_id = auth.uid() AND module = 'equipment' AND can_edit = true)
);

-- Suppliers
CREATE POLICY "Anyone can view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage suppliers" ON public.suppliers FOR ALL USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users with edit permission can manage suppliers" ON public.suppliers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.module_permissions WHERE user_id = auth.uid() AND module = 'food-safety' AND can_edit = true)
);

-- Food Safety Logs
CREATE POLICY "Anyone can view food safety logs" ON public.food_safety_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage food safety logs" ON public.food_safety_logs FOR ALL USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users with edit permission can manage food safety logs" ON public.food_safety_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.module_permissions WHERE user_id = auth.uid() AND module = 'food-safety' AND can_edit = true)
);

-- Training Materials
CREATE POLICY "Anyone can view training materials" ON public.training_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head chefs can manage training materials" ON public.training_materials FOR ALL USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users with edit permission can manage training" ON public.training_materials FOR ALL USING (
    EXISTS (SELECT 1 FROM public.module_permissions WHERE user_id = auth.uid() AND module = 'training' AND can_edit = true)
);

-- Training Records
CREATE POLICY "Users can view their own training records" ON public.training_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Head chefs can view all training records" ON public.training_records FOR SELECT USING (public.is_head_chef(auth.uid()));
CREATE POLICY "Users can update their own training records" ON public.training_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Head chefs can manage all training records" ON public.training_records FOR ALL USING (public.is_head_chef(auth.uid()));

-- =====================
-- UPDATE TRIGGERS
-- =====================
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prep_lists_updated_at BEFORE UPDATE ON public.prep_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_allergens_updated_at BEFORE UPDATE ON public.allergens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cheatsheets_updated_at BEFORE UPDATE ON public.cheatsheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_roster_shifts_updated_at BEFORE UPDATE ON public.roster_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_food_safety_logs_updated_at BEFORE UPDATE ON public.food_safety_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_materials_updated_at BEFORE UPDATE ON public.training_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();