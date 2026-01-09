-- Tambah kolom baru ke tabel profiles untuk data lengkap
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS expertise TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update trigger handle_new_user untuk menerima data tambahan
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

  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    role,
    expertise,
    experience,
    bio,
    age,
    phone
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    user_role_value,
    NEW.raw_user_meta_data->>'expertise',
    NEW.raw_user_meta_data->>'experience',
    NEW.raw_user_meta_data->>'bio',
    (NEW.raw_user_meta_data->>'age')::INTEGER,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;