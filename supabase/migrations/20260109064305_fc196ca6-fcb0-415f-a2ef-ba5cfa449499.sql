-- Allow anyone to view mentor profiles (for class enrollment, public listings, etc.)
CREATE POLICY "Anyone can view mentor profiles"
ON public.profiles FOR SELECT
USING (role = 'mentor');