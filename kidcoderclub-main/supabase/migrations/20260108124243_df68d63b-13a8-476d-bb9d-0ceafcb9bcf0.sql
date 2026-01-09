-- Allow mentors to view profiles of their enrolled students
CREATE POLICY "Mentors can view enrolled students profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.mentor_id = auth.uid()
    AND enrollments.user_id = profiles.user_id
  )
);