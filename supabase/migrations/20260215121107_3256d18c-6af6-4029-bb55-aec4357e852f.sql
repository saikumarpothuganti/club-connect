
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'club_admin', 'member');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  college_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  club_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create clubs table
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  boundary_lat DOUBLE PRECISION,
  boundary_lng DOUBLE PRECISION,
  boundary_radius DOUBLE PRECISION DEFAULT 100,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK from profiles to clubs
ALTER TABLE public.profiles ADD CONSTRAINT profiles_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE SET NULL;

-- Create attendance_sessions table
CREATE TABLE public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create day_status table
CREATE TABLE public.day_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  status_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_open BOOLEAN NOT NULL DEFAULT false,
  opened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, status_date)
);

-- Create webauthn_credentials table
CREATE TABLE public.webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Helper function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function: get_user_club_id
CREATE OR REPLACE FUNCTION public.get_user_club_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT club_id FROM public.profiles WHERE id = _user_id
$$;

-- Helper function: is_club_admin_of
CREATE OR REPLACE FUNCTION public.is_club_admin_of(_user_id UUID, _club_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clubs
    WHERE id = _club_id AND admin_id = _user_id
  )
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_day_status_updated_at BEFORE UPDATE ON public.day_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, college_id, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'college_id', ''),
    NEW.email
  );
  -- Auto-assign member role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Super admin can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Club admin can view club members" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'club_admin') AND club_id = public.get_user_club_id(auth.uid())
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Super admin can update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Club admin can update club member profiles" ON public.profiles FOR UPDATE USING (
  public.has_role(auth.uid(), 'club_admin') AND club_id = public.get_user_club_id(auth.uid())
);
CREATE POLICY "Super admin can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for user_roles
CREATE POLICY "Anyone authenticated can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin can manage roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for clubs
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin can create clubs" ON public.clubs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can update clubs" ON public.clubs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Club admin can update own club" ON public.clubs FOR UPDATE TO authenticated USING (admin_id = auth.uid());
CREATE POLICY "Super admin can delete clubs" ON public.clubs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for attendance_sessions
CREATE POLICY "Members can view own sessions" ON public.attendance_sessions FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Super admin can view all sessions" ON public.attendance_sessions FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Club admin can view club sessions" ON public.attendance_sessions FOR SELECT USING (
  public.has_role(auth.uid(), 'club_admin') AND public.is_club_admin_of(auth.uid(), club_id)
);
CREATE POLICY "Members can insert own sessions" ON public.attendance_sessions FOR INSERT TO authenticated WITH CHECK (member_id = auth.uid());
CREATE POLICY "Members can update own sessions" ON public.attendance_sessions FOR UPDATE TO authenticated USING (member_id = auth.uid());
CREATE POLICY "Club admin can manage club sessions" ON public.attendance_sessions FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'club_admin') AND public.is_club_admin_of(auth.uid(), club_id)
);
CREATE POLICY "Super admin can manage all sessions" ON public.attendance_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for day_status
CREATE POLICY "Anyone authenticated can view day status" ON public.day_status FOR SELECT TO authenticated USING (true);
CREATE POLICY "Club admin can manage own club day status" ON public.day_status FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'club_admin') AND public.is_club_admin_of(auth.uid(), club_id)
);
CREATE POLICY "Club admin can update own club day status" ON public.day_status FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'club_admin') AND public.is_club_admin_of(auth.uid(), club_id)
);
CREATE POLICY "Super admin can manage all day status" ON public.day_status FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for webauthn_credentials
CREATE POLICY "Users can view own credentials" ON public.webauthn_credentials FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own credentials" ON public.webauthn_credentials FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own credentials" ON public.webauthn_credentials FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own credentials" ON public.webauthn_credentials FOR DELETE TO authenticated USING (user_id = auth.uid());
