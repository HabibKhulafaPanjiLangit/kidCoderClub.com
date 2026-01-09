-- Add RLS policy for mentors to manage modules in their own classes
CREATE POLICY "Mentors can manage modules in their classes"
ON public.modules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = modules.class_id 
    AND classes.mentor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = modules.class_id 
    AND classes.mentor_id = auth.uid()
  )
);