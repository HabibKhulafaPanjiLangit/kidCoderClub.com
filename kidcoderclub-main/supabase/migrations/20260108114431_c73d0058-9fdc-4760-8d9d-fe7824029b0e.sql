-- Create assignment_submissions table for tracking student submissions
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'submitted',
  feedback TEXT,
  grade INTEGER,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES auth.users(id),
  UNIQUE(assignment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Students can view their own submissions
CREATE POLICY "Students can view their own submissions"
ON public.assignment_submissions FOR SELECT
USING (user_id = auth.uid());

-- Students can insert their own submissions
CREATE POLICY "Students can insert their own submissions"
ON public.assignment_submissions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Students can update their own submissions (before grading)
CREATE POLICY "Students can update their own submissions"
ON public.assignment_submissions FOR UPDATE
USING (user_id = auth.uid() AND status = 'submitted');

-- Mentors can view submissions for their assignments
CREATE POLICY "Mentors can view submissions for their assignments"
ON public.assignment_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignments
    WHERE assignments.id = assignment_submissions.assignment_id
    AND assignments.mentor_id = auth.uid()
  )
);

-- Mentors can update submissions (for grading)
CREATE POLICY "Mentors can grade submissions"
ON public.assignment_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.assignments
    WHERE assignments.id = assignment_submissions.assignment_id
    AND assignments.mentor_id = auth.uid()
  )
);

-- Admins can manage all submissions
CREATE POLICY "Admins can manage all submissions"
ON public.assignment_submissions FOR ALL
USING (is_admin());