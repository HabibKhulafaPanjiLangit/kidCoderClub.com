-- Drop old policy that checks classes.mentor_id (which can be NULL)
DROP POLICY IF EXISTS "Mentors can view enrollments in their classes" ON public.enrollments;

-- Create new policy using enrollments.mentor_id directly
CREATE POLICY "Mentors can view enrollments for their students"
ON public.enrollments
FOR SELECT
USING (mentor_id = auth.uid());