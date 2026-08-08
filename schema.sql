-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Congregations Table
CREATE TABLE public.congregations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles Table (Extends Supabase Auth Users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    congregation_id UUID REFERENCES public.congregations(id),
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Committees Table
CREATE TABLE public.committees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    congregation_id UUID REFERENCES public.congregations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#00338D',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Events Table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    congregation_id UUID REFERENCES public.congregations(id) ON DELETE CASCADE,
    committee_id UUID REFERENCES public.committees(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT DEFAULT 'Templo',
    description TEXT,
    observations TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.congregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read profiles in their own congregation
CREATE POLICY "Users can view profiles in their congregation"
ON public.profiles FOR SELECT
USING (congregation_id = (SELECT congregation_id FROM public.profiles WHERE id = auth.uid()));

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- Committees: Users can view and manage committees for their congregation
CREATE POLICY "Users can view committees in their congregation"
ON public.committees FOR SELECT
USING (congregation_id = (SELECT congregation_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert committees"
ON public.committees FOR INSERT
WITH CHECK (
    congregation_id = (SELECT congregation_id FROM public.profiles WHERE id = auth.uid()) 
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Events: Users can view and manage events in their congregation
CREATE POLICY "Users can view events in their congregation"
ON public.events FOR SELECT
USING (congregation_id = (SELECT congregation_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Editors and admins can insert events"
ON public.events FOR INSERT
WITH CHECK (
    congregation_id = (SELECT congregation_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'editor')
);

CREATE POLICY "Editors and admins can update events"
ON public.events FOR UPDATE
USING (
    congregation_id = (SELECT congregation_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'editor')
);

CREATE POLICY "Editors and admins can delete events"
ON public.events FOR DELETE
USING (
    congregation_id = (SELECT congregation_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'editor')
);

-- 4. TRIGGERS

-- Automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'editor');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. INITIAL DATA (Run after creating a congregation and linking it)
-- Note: Replace the UUID with your congregation's UUID once created.
/*
INSERT INTO public.committees (congregation_id, name, color) VALUES
('CONGREGATION_UUID', 'Alabanza', '#00338D'),
('CONGREGATION_UUID', 'Escuela Dominical', '#00AEEF'),
('CONGREGATION_UUID', 'Familia', '#FFC72C'),
('CONGREGATION_UUID', 'Intercesión', '#00338D'),
('CONGREGATION_UUID', 'Obra Social', '#00AEEF'),
('CONGREGATION_UUID', 'Misiones', '#FFC72C'),
('CONGREGATION_UUID', 'Damas Dorcas', '#00338D'),
('CONGREGATION_UUID', 'DECOM', '#00AEEF'),
('CONGREGATION_UUID', 'Jóvenes', '#FFC72C'),
('CONGREGATION_UUID', 'Ujieres', '#00338D'),
('CONGREGATION_UUID', 'Junta Local', '#00AEEF');
*/
