-- Add approval_status and certificate_url to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- Create assignments table for mentor tasks
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create student_certificates table
CREATE TABLE public.student_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  certificate_url TEXT NOT NULL,
  issued_by UUID NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mentor_salaries table
CREATE TABLE public.mentor_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  period TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_salaries ENABLE ROW LEVEL SECURITY;

-- RLS for assignments
CREATE POLICY "Mentors can manage their own assignments"
ON public.assignments FOR ALL
USING (mentor_id = auth.uid());

CREATE POLICY "Admins can manage all assignments"
ON public.assignments FOR ALL
USING (is_admin());

CREATE POLICY "Students can view assignments of enrolled classes"
ON public.assignments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.enrollments
  WHERE enrollments.class_id = assignments.class_id
  AND enrollments.user_id = auth.uid()
));

-- RLS for student_certificates
CREATE POLICY "Admins can manage all certificates"
ON public.student_certificates FOR ALL
USING (is_admin());

CREATE POLICY "Students can view their own certificates"
ON public.student_certificates FOR SELECT
USING (user_id = auth.uid());

-- RLS for mentor_salaries
CREATE POLICY "Admins can manage all salaries"
ON public.mentor_salaries FOR ALL
USING (is_admin());

CREATE POLICY "Mentors can view their own salaries"
ON public.mentor_salaries FOR SELECT
USING (mentor_id = auth.uid());

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('certificates', 'certificates', true),
  ('assignments', 'assignments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for certificates bucket
CREATE POLICY "Anyone can view certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

CREATE POLICY "Authenticated users can upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own certificates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can delete certificates"
ON storage.objects FOR DELETE
USING (bucket_id = 'certificates' AND is_admin());

-- Storage policies for assignments bucket
CREATE POLICY "Anyone can view assignments"
ON storage.objects FOR SELECT
USING (bucket_id = 'assignments');

CREATE POLICY "Mentors can upload assignments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assignments' AND is_mentor());

CREATE POLICY "Mentors can update assignments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'assignments' AND is_mentor());

CREATE POLICY "Mentors and admins can delete assignments"
ON storage.objects FOR DELETE
USING (bucket_id = 'assignments' AND (is_mentor() OR is_admin()));

-- Trigger for assignments updated_at
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();