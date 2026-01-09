-- Tambahkan 'mentor' ke enum user_role
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'mentor';

-- Update function untuk handle new user dengan validasi role yang lebih baik
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value user_role;
  role_text TEXT;
BEGIN
  -- Ambil role dari metadata, default ke 'student'
  role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Validasi role yang diizinkan
  IF role_text IN ('admin', 'mentor', 'student') THEN
    user_role_value := role_text::user_role;
  ELSE
    user_role_value := 'student'::user_role;
  END IF;

  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    user_role_value
  );
  RETURN NEW;
END;
$$;