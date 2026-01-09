-- Create is_mentor function using plpgsql to avoid enum value check at creation time
CREATE OR REPLACE FUNCTION public.is_mentor()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role::text = 'mentor'
  );
END;
$function$;