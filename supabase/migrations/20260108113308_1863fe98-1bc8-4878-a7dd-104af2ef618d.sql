-- Create class_mentors table for many-to-many relationship
CREATE TABLE public.class_mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  max_students INTEGER DEFAULT 20,
  current_students INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, mentor_id)
);

-- Add mentor_id to enrollments to track which mentor the student chose
ALTER TABLE public.enrollments ADD COLUMN mentor_id UUID REFERENCES public.profiles(user_id);

-- Enable RLS on class_mentors
ALTER TABLE public.class_mentors ENABLE ROW LEVEL SECURITY;

-- Anyone can view class mentors (for public class detail page)
CREATE POLICY "Anyone can view class mentors"
ON public.class_mentors FOR SELECT
USING (true);

-- Admins can manage all class mentors
CREATE POLICY "Admins can manage all class mentors"
ON public.class_mentors FOR ALL
USING (is_admin());

-- Mentors can update their own availability
CREATE POLICY "Mentors can update their availability"
ON public.class_mentors FOR UPDATE
USING (mentor_id = auth.uid())
WITH CHECK (mentor_id = auth.uid());