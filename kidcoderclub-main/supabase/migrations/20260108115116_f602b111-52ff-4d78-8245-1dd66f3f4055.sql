-- Create module_progress table for tracking student progress on each module
CREATE TABLE public.module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- Students can view their own progress
CREATE POLICY "Students can view their own progress"
ON public.module_progress FOR SELECT
USING (user_id = auth.uid());

-- Students can insert their own progress
CREATE POLICY "Students can insert their own progress"
ON public.module_progress FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Students can delete their own progress (unmark as complete)
CREATE POLICY "Students can delete their own progress"
ON public.module_progress FOR DELETE
USING (user_id = auth.uid());

-- Mentors can view progress for their classes
CREATE POLICY "Mentors can view progress for their classes"
ON public.module_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = module_progress.class_id
    AND classes.mentor_id = auth.uid()
  )
);

-- Admins can manage all progress
CREATE POLICY "Admins can manage all progress"
ON public.module_progress FOR ALL
USING (is_admin());