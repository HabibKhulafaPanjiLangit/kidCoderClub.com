-- Add mentor_id column to classes table
ALTER TABLE public.classes 
ADD COLUMN mentor_id UUID REFERENCES public.profiles(user_id);

-- Create index for better query performance
CREATE INDEX idx_classes_mentor_id ON public.classes(mentor_id);

-- RLS Policy: Mentors can view their own classes
CREATE POLICY "Mentors can view their own classes"
ON public.classes
FOR SELECT
USING (mentor_id = auth.uid());

-- RLS Policy: Mentors can update their own classes
CREATE POLICY "Mentors can update their own classes"
ON public.classes
FOR UPDATE
USING (mentor_id = auth.uid());

-- RLS Policy: Mentors can view enrollments in their classes
CREATE POLICY "Mentors can view enrollments in their classes"
ON public.enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE classes.id = enrollments.class_id 
    AND classes.mentor_id = auth.uid()
  )
);